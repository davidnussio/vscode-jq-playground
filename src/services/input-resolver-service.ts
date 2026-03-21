import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { HttpClient } from "@effect/platform";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import type { TextDocument } from "vscode";
import { InputResolutionError } from "../domain/errors";

const JQ_LINE_REGEX = /^jq\s/;
const COMMENT_LINE_REGEX = /^#/;
const WHITESPACE_REGEX = /\s+/;

// --- Path resolution helper ---

const ABSOLUTE_PATH_REGEX = /^(\/|[a-z]:\\)/i;

const resolvePath = (cwd: string, filePath: string): string =>
  ABSOLUTE_PATH_REGEX.test(filePath)
    ? path.resolve(filePath)
    : path.resolve(path.join(cwd, filePath));

// --- URL processor ---

const isUrl = (s: string): boolean =>
  Schema.decodeUnknownOption(Schema.URL)(s).pipe(Option.isSome);

const urlProcessor = Effect.fn("InputResolver.url")(function* (
  context: string
) {
  if (!isUrl(context)) {
    return yield* Effect.fail(
      new InputResolutionError({ message: "Not a valid URL" })
    );
  }
  const client = yield* HttpClient.HttpClient;
  const response = yield* client.get(context).pipe(
    Effect.timeout(Duration.seconds(10)),
    Effect.mapError(
      () =>
        new InputResolutionError({
          message: `URL fetch timed out or failed: ${context}`,
        })
    )
  );
  return yield* response.text;
});

// --- Workspace document processor ---

const workspaceDocProcessor = (
  context: string,
  textDocuments: ReadonlyArray<TextDocument>
) => {
  const found = textDocuments.find(
    (doc) => doc.fileName === context || path.basename(doc.fileName) === context
  );
  return found
    ? Effect.succeed(found.getText())
    : Effect.fail(
        new InputResolutionError({
          message: `No workspace document matches: ${context}`,
        })
      );
};

// --- Local file processor (single read attempt, no double stat) ---

const readFileAtPath = (resolvedPath: string) =>
  Effect.try({
    try: () => fs.readFileSync(resolvedPath, "utf-8"),
    catch: () =>
      new InputResolutionError({
        message: `Failed to read file: ${resolvedPath}`,
      }),
  });

const fileProcessor = (cwd: string, context: string) => {
  const trimmed = context.trim();
  if (!trimmed) {
    return Effect.fail(new InputResolutionError({ message: "Empty context" }));
  }

  const resolvedPath = resolvePath(cwd, trimmed);

  // Try single file first
  return readFileAtPath(resolvedPath).pipe(
    Effect.catchAll(() => {
      // Try multiple files separated by spaces
      const files = trimmed.split(WHITESPACE_REGEX);
      if (files.length <= 1) {
        return Effect.fail(
          new InputResolutionError({
            message: `File not found: ${resolvedPath}`,
          })
        );
      }
      const resolvedFiles = files.map((f) => resolvePath(cwd, f));
      return Effect.all(resolvedFiles.map(readFileAtPath)).pipe(
        Effect.map((contents) => contents.join("\n"))
      );
    })
  );
};

// --- Shell command processor (lines starting with "$ ") ---

const SHELL_COMMAND_REGEX = /^\$ (.+)$/;

const shellCommandProcessor = (
  context: string,
  cwd: string,
  variables: Map<string, string>,
  timeout = Duration.seconds(10)
) => {
  const match = SHELL_COMMAND_REGEX.exec(context.trim());
  if (!match) {
    return Effect.fail(
      new InputResolutionError({ message: "Not a shell command" })
    );
  }

  // Substitute variables in the command string
  let commandStr = match[1];
  for (const [key, value] of variables) {
    commandStr = commandStr.replace(new RegExp(`\\$${key}\\b`, "g"), value);
  }

  return Effect.async<string, InputResolutionError>((resume) => {
    const result = { stdout: [] as string[], stderr: [] as string[] };
    const proc = spawn(commandStr, {
      cwd,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    if (proc.stdout) {
      proc.stdout.on("data", (data) => result.stdout.push(data.toString()));
    }
    if (proc.stderr) {
      proc.stderr.on("data", (data) => result.stderr.push(data.toString()));
    }

    const commandTimeout = setTimeout(() => {
      proc.kill("SIGKILL");
      resume(
        Effect.fail(
          new InputResolutionError({
            message: `Shell command timed out: ${commandStr}`,
          })
        )
      );
    }, Duration.toMillis(timeout));

    proc.on("error", (error) => {
      clearTimeout(commandTimeout);
      resume(
        Effect.fail(
          new InputResolutionError({
            message: `Shell command failed: ${error.message}`,
          })
        )
      );
    });

    proc.on("close", (code) => {
      clearTimeout(commandTimeout);
      if (code === 0) {
        resume(Effect.succeed(result.stdout.join("")));
      } else {
        resume(
          Effect.fail(
            new InputResolutionError({
              message: `Shell command exited with code ${code}: ${result.stderr.join("")}`,
            })
          )
        );
      }
    });
  });
};

// --- Inline JSON processor ---

const inlineJsonProcessor = (
  document: TextDocument,
  startLine: number,
  context: string
) => {
  const lines = [context];
  let line = startLine + 1;
  while (line < document.lineCount) {
    const text = document.lineAt(line++).text;
    if (JQ_LINE_REGEX.test(text) || COMMENT_LINE_REGEX.test(text)) {
      break;
    }
    lines.push(`${text}\n`);
  }
  return Effect.succeed(lines.join(""));
};

export class InputResolverService extends Effect.Service<InputResolverService>()(
  "@jqpg/InputResolverService",
  {
    sync: () => {
      const resolve = Effect.fn("InputResolverService.resolve")(function* (
        document: TextDocument,
        inputLineIndex: number,
        cwd: string,
        textDocuments: ReadonlyArray<TextDocument>,
        variables?: Map<string, string>
      ) {
        if (inputLineIndex >= document.lineCount) {
          return yield* new InputResolutionError({
            message: `Input line ${inputLineIndex} out of range`,
          });
        }

        const context = document.lineAt(inputLineIndex).text;
        const vars = variables ?? new Map<string, string>();

        const processors = [
          urlProcessor(context),
          workspaceDocProcessor(context, textDocuments),
          shellCommandProcessor(context, cwd, vars),
          fileProcessor(cwd, context),
          inlineJsonProcessor(document, inputLineIndex, context),
        ];

        return yield* Effect.firstSuccessOf(processors).pipe(
          Effect.mapError(
            () =>
              new InputResolutionError({
                message: `Could not resolve input from line ${inputLineIndex}: "${context}"`,
              })
          )
        );
      });

      return { resolve };
    },
  }
) {}
