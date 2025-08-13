import * as fs from "node:fs";
import * as path from "node:path";
import { HttpClient } from "@effect/platform";
import { pipe } from "effect";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { parse } from "shell-quote";
import {
  Position,
  Range,
  type TextDocument,
  type TextEditor,
  window,
  workspace,
} from "vscode";
import {
  activeTextEditor,
  showErrorMessage,
  showWarningMessage,
} from "../adapters/vscode-adapter";
import type { JqMatch } from "../code-lens";
import { CONFIGS } from "../configs";
import { ExtensionConfig, jqPathSetting } from "../extension-config";
import { parseJqCommandArgs, spawnCommandEffect } from "../lib/command-line";
import {
  type RenderOutputType,
  renderError,
  renderOutput,
} from "../renderers";
import { VariableResolver } from "../lib/variable-resolver";

function getFileName(cwd: string, context: string): string {
  if (context.search(/^(\/|[a-z]:\\)/gi) === 0) {
    // Resolve absolute unix and window path
    return path.resolve(context);
  }
  // Resolve relative path
  return path.resolve(path.join(cwd, context));
}

function isFilepath(cwd: string, context: string): boolean {
  if (!context) {
    return false;
  }
  const resolvedPath = getFileName(cwd, context);
  const fileExists = fs.existsSync(resolvedPath);
  if (fileExists) {
    return true;
  }
  const files = context.split(/\s+/);
  return files.reduce(
    (acc, cur) => acc && fs.existsSync(getFileName(cwd, cur)),
    true
  );
}

function getFiles(cwd: string, context: string): ReadonlyArray<string> {
  const resolvedPath = getFileName(cwd, context);
  const fileExists = fs.existsSync(resolvedPath);
  if (fileExists) {
    return [resolvedPath];
  }
  const files = context.split(/\s+/);
  return files.map((file) => getFileName(cwd, file));
}

// Funzioni di supporto (devono essere definite PRIMA di executeJqCommand per evitare errori di hoisting)
function estraiMultilineQuery(
  document: TextDocument,
  startLine: number,
  queryLineWithoutOpts: string
): { query: string; lineOffset: number } {
  let lineOffset = 1;
  for (
    let line = startLine + lineOffset, documentLine = "";
    queryLineWithoutOpts.search(/[^\\]'\s*$/) === -1 &&
    line < document.lineCount;
    line++
  ) {
    documentLine = document.lineAt(line).text;
    queryLineWithoutOpts += documentLine;
    lineOffset++;
  }
  return {
    query: queryLineWithoutOpts.slice(1, -1),
    lineOffset,
  };
}

function gestisciRedirezioneOutput(
  document: TextDocument,
  contextLine: number
): { outputFile: string; contextLine: number; lineOffset: number } {
  const outputFile = document.lineAt(contextLine).text.replace("> ", "").trim();
  return { outputFile, contextLine: contextLine + 1, lineOffset: 1 };
}

function gestisciRedirezioneOutputAppend(
  document: TextDocument,
  contextLine: number
): {
  outputFile: string;
  contextLine: number;
  lineOffset: number;
  append: boolean;
} {
  const outputFile = document
    .lineAt(contextLine)
    .text.replace(">> ", "")
    .trim();
  return {
    outputFile,
    contextLine: contextLine + 1,
    lineOffset: 1,
    append: true,
  };
}

function renderOutputDecorator(
  params: { openResult: RenderOutputType },
  outputFile: string,
  appendToOutputFile: boolean,
  cwd: string
): (output: string) => void {
  return (output) => {
    const outFile = outputFile ? getFileName(cwd, outputFile) : false;
    if (outFile) {
      if (appendToOutputFile) {
        fs.appendFileSync(outFile, output);
      } else {
        fs.writeFileSync(outFile, output);
      }
    } else {
      renderOutput(params.openResult)(output);
    }
  };
}

// function gestisciInputDaUrl(context: string): void {
//   fetch(context)
//     .then((data) => data.text())
//     .catch((err) => {
//       Logger.append(err);
//       Logger.show();
//     });
// }

function gestisciInputDaFilepathLocale(
  cwd: string,
  context: string,
  args: string[]
): string {
  spawnCommand(CONFIGS.FILEPATH, args.concat(getFiles(cwd, context.trim())), {
    cwd,
  })()
    .then(([_, out]): [string, string] => {
      return out;
    })
    .catch(renderError);
}

function gestisciInputDaShellCommand(
  context: string,
  variables: Record<string, string>,
  cwd: string
): void {
  const [httpCli, ...httpCliOptions] = parse(context.replace("$ ", ""), {
    ...process.env,
    ...variables,
  });
  if (httpCli === "http") {
    httpCliOptions.unshift("--ignore-stdin");
  }
  spawnCommandEffect(httpCli as string, httpCliOptions as string[], { cwd })()
    .then(([_, out]: [string, string]) => {
      return out;
    })
    .catch(renderError);
}

// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------

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

function isUrl(url: string): boolean {
  return Schema.decodeUnknownOption(Schema.URL)(url).pipe(Option.isSome);
}

const urlProcessor = Effect.fn("processUrlContent")(function* (
  context: string
) {
  if (!isUrl(context)) {
    return yield* Effect.fail("Is not a valid URL");
  }
  const client = yield* HttpClient.HttpClient;
  const response = yield* client.get(context);
  return yield* response.text;
});

const localFileProcessor = (cwd: string, context: string) =>
  Effect.if(Effect.succeed(isFilepath(cwd, context.trim())), {
    onTrue: () =>
      Effect.tryPromise(() =>
        Promise.all(
          getFiles(cwd, context.trim()).map((file) =>
            fs.promises.readFile(file, "utf-8")
          )
        ).then((contents) => contents.join("\n"))
      ),
    onFalse: () => Effect.fail("Not a local file path"),
  });

const workspaceFileProcessor = (
  context: string,
  textDocuments: ReadonlyArray<TextDocument>
) => {
  const foundDocument = textDocuments.find(
    (document) =>
      document.fileName === context ||
      path.basename(document.fileName) === context
  );
  return foundDocument
    ? Effect.succeed(foundDocument.getText())
    : Effect.fail("");
};

const inlineJsonProcessor = (
  params: { document: TextDocument; range: Range },
  document: TextDocument,
  context: string,
  lineOffset: number
) => {
  const contextLines = [context];
  let line = params.range.start.line + lineOffset;
  while (line < document.lineCount) {
    const lineText = document.lineAt(line++).text;
    if (
      /^(jq)\s+(.+?)/.exec(lineText) !== null ||
      /^#/.exec(lineText) !== null
    ) {
      break;
    }
    contextLines.push(`${lineText}\n`);
  }

  return Effect.succeed(contextLines.join(""));
};

const readEditorVariables = (editor: TextEditor): Map<string, string> => {
  const variables = new Map<string, string>();
  for (let i = 0; i < editor.document.lineCount; i++) {
    const lineText = editor.document.lineAt(i).text.trim();
    if (lineText.startsWith("jq")) {
      break;
    }
    if (lineText.startsWith("#")) {
      continue;
    }
    const [varName, varValue] = lineText.split("=");
    if (varName && varValue) {
      variables.set(varName.trim(), varValue.trim());
    }
  }
  return variables;
};

const findPreviousJqQueryLine = (editor: TextEditor): Option.Option<number> => {
  let { line } = editor.selection.start;
  let queryLine = "";

  do {
    queryLine = editor.document.lineAt(line).text;
  } while (queryLine.startsWith("jq") === false && line-- > 0);

  return queryLine.startsWith("jq") ? Option.some(line) : Option.none();
};

export const queryRunner = (openResult: RenderOutputType) =>
  Effect.fnUntraced(function* () {
    yield* Effect.log("Running jq query from editor");
    const activeEditor = activeTextEditor();

    if (Option.isNone(activeEditor)) {
      yield* showWarningMessage("No active text editor found.");
      return yield* Effect.fail(
        "No active text editor found. Please open a file."
      );
    }

    const editor = yield* activeEditor;

    const jqQueryLine = findPreviousJqQueryLine(editor);

    if (Option.isNone(jqQueryLine)) {
      yield* showWarningMessage(
        "Current line does not contain jq query string"
      );
    } else {
      const line = yield* jqQueryLine;
      const range = new Range(
        new Position(line, 0),
        new Position(line, editor.document.lineAt(line).text.length)
      );

      const match: JqMatch = {
        document: editor.document,
        range,
        openResult,
      };
      yield* executeJqCommand(match);
    }
  });
// Esegue un comando jq dato un documento e delle variabili
export const executeJqCommand = (params: {
  document: TextDocument;
  range: Range;
  openResult: RenderOutputType;
}) =>
  Effect.gen(function* () {
    yield* Effect.log(
      `Executing jq command with params: ${JSON.stringify(params, null, 2)}`
    );
    const { document } = params;
    const editor = yield* activeTextEditor();
    const variables = readEditorVariables(editor);
    const variableResolver = yield* Effect.service(VariableResolver);

    yield* Effect.log(`Loaded variables: ${JSON.stringify(variables)}`);

    const cwd = currentWorkingDirectory();
    const queryLine: string = document
      .lineAt(params.range.start.line)
      .text.replace(/jq\s+/, "");
    const args = yield* variableResolver.resolveMany(
      parseJqCommandArgs(queryLine)
    );
    let queryLineWithoutOpts = args.at(-1) ?? "";
    let lineOffset = 1;

    // Multiline jq filter tra apici
    if (queryLineWithoutOpts.startsWith("'")) {
      const res = estraiMultilineQuery(
        document,
        params.range.start.line,
        queryLineWithoutOpts
      );
      queryLineWithoutOpts = res.query;
      args[args.length - 1] = queryLineWithoutOpts;
      lineOffset += res.lineOffset - 1;
    }

    let contextLine = Math.min(
      params.range.start.line + lineOffset,
      document.lineCount - 1
    );
    let outputFile = "";
    let appendToOutputFile = false;

    if (document.lineAt(contextLine)?.text?.startsWith("> ")) {
      const res = gestisciRedirezioneOutput(document, contextLine);
      outputFile = res.outputFile;
      contextLine = res.contextLine;
      lineOffset += res.lineOffset;
    }
    if (document.lineAt(contextLine)?.text?.startsWith(">> ")) {
      const res = gestisciRedirezioneOutputAppend(document, contextLine);
      outputFile = res.outputFile;
      contextLine = res.contextLine;
      appendToOutputFile = true;
      lineOffset += res.lineOffset;
    }
    const context: string = document.lineAt(contextLine)?.text;
    lineOffset++;

    // if (isWorkspaceFile(queryLineWithoutOpts, workspace.textDocuments)) {
    //   args[args.length - 1] = getWorkspaceFile(
    //     queryLineWithoutOpts,
    //     workspace.textDocuments
    //   );
    // }

    yield* Effect.log(
      `Executing jq command with args: ${JSON.stringify(args)}`
    );

    const { jq } = yield* ExtensionConfig;

    const jqExecutablePath = yield* jq.path.pipe(
      Effect.tap((path) =>
        Option.isSome(path)
          ? Effect.succeed(path)
          : Effect.fail(
              `No jq binary path found (${path}). Please configure it in the settings.`
            )
      ),
      Effect.tapError((message) => showErrorMessage(message))
      // Effect.map((e) =>
      //   Option.isSome(e)
      //     ? e
      //     : Effect.fail(
      //         "No jq binary path found. Please configure it in the settings."
      //       )
      // )
    );

    yield* Effect.log(`Using jq binary at: ${jqExecutablePath}`);

    const jqCommand = spawnCommandEffect(
      Option.getOrElse(jqExecutablePath, () => ""),
      args,
      {
        cwd,
      }
    );

    const renderOutputDecotator = renderOutputDecorator(
      params,
      outputFile,
      appendToOutputFile,
      cwd
    );

    const processors = [
      urlProcessor(context),
      workspaceFileProcessor(context, workspace.textDocuments),
      localFileProcessor(cwd, context),
      //  gestisciInputDaFilepathLocale(cwd, context, args),
      // /^\$ (http|curl|wget|cat|echo|ls|dir|grep|tail|head|find)(?:\.exe)? /.exec(
      //   context
      // ),
      // gestisciInputDaShellCommand(context, variables, cwd),
      inlineJsonProcessor(params, document, context, lineOffset),
    ];

    const inputData = yield* Effect.firstSuccessOf(processors);

    const result = yield* jqCommand(inputData).pipe(
      Effect.tapErrorCause((cause) => {
        return pipe(
          Effect.fail(Cause.pretty(cause)),
          Effect.tapError((errorMessage) =>
            showErrorMessage(errorMessage, "Open Settings").pipe(
              Effect.andThen((userChoice) =>
                userChoice === "Open Settings" ? jqPathSetting() : Effect.void
              )
            )
          )
        );
      })
    );
    renderOutputDecotator(result);
  });
