import * as path from "node:path";
import { pipe } from "effect";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import { Position, Range, type TextDocument, window, workspace } from "vscode";
import {
  activeTextEditor,
  showWarningMessage,
} from "../adapters/vscode-adapter";
import { InputResolverService } from "../services/input-resolver-service";
import { JqExecutionService } from "../services/jq-execution-service";
import { OutputRendererService } from "../services/output-renderer-service";
import { QueryParserService } from "../services/query-parser-service";

export type { RenderOutputType } from "../domain/models";

const currentWorkingDirectory = (): string => {
  const cwdActiveFile = pipe(
    Option.fromNullable(window.activeTextEditor),
    Option.map((editor) => editor.document.fileName),
    Option.map((fileName) => path.join(fileName, ".."))
  );
  const cwdFirstWorkspace = pipe(
    Option.fromNullable(workspace.workspaceFolders),
    Option.map((folder) => folder[0].uri.path),
    Option.getOrElse(() => ".")
  );
  return Option.getOrElse(cwdActiveFile, () => cwdFirstWorkspace);
};

const findPreviousJqQueryLine = (
  document: import("vscode").TextDocument,
  startLine: number
): Option.Option<number> => {
  let line = startLine;
  while (line >= 0) {
    if (document.lineAt(line).text.startsWith("jq")) {
      return Option.some(line);
    }
    line--;
  }
  return Option.none();
};

export const executeJqCommand = (params: {
  document: TextDocument;
  range: Range;
  openResult: "output" | "editor";
}) =>
  Effect.gen(function* () {
    yield* Effect.log("Executing jq command...");

    const queryParser = yield* QueryParserService;
    const inputResolver = yield* InputResolverService;
    const jqExecution = yield* JqExecutionService;
    const renderer = yield* OutputRendererService;

    const cwd = currentWorkingDirectory();

    // Read editor variables (VAR=value lines before jq)
    const variables = queryParser.readEditorVariables(params.document);

    // Parse the query from the document
    const parsed = yield* queryParser.parse(
      params.document,
      params.range.start.line,
      params.openResult
    );

    yield* Effect.log(`Parsed args: ${JSON.stringify(parsed.args)}`);

    // Resolve input data (with variables for shell command substitution)
    const inputData = yield* inputResolver.resolve(
      params.document,
      parsed.inputLineIndex,
      cwd,
      workspace.textDocuments,
      variables
    );

    // Execute jq
    const result = yield* jqExecution
      .execute(parsed.args, inputData, { cwd })
      .pipe(
        Effect.catchAll((error) =>
          renderer
            .renderError(error.message)
            .pipe(Effect.zipRight(Effect.fail(error)))
        )
      );

    // Render output
    yield* renderer.render(result, parsed.outputTarget, cwd);
  });

export const queryRunner = (openResult: "output" | "editor") =>
  Effect.fnUntraced(function* () {
    yield* Effect.log(`Running jq query (${openResult})`);
    const editor = activeTextEditor();

    if (Option.isNone(editor)) {
      yield* showWarningMessage("No active text editor found.");
      return yield* Effect.fail("No active text editor found.");
    }

    const ed = yield* editor;
    const jqQueryLine = findPreviousJqQueryLine(
      ed.document,
      ed.selection.start.line
    );

    if (Option.isNone(jqQueryLine)) {
      yield* showWarningMessage(
        "Current line does not contain jq query string"
      );
    } else {
      const line = yield* jqQueryLine;
      const range = new Range(
        new Position(line, 0),
        new Position(line, ed.document.lineAt(line).text.length)
      );
      yield* executeJqCommand({
        document: ed.document,
        range,
        openResult,
      });
    }
  });
