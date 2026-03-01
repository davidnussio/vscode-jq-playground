import { Effect, Option } from "effect";
import * as vscode from "vscode";
import {
  activeTextEditor,
  showErrorMessage,
  thenable,
} from "./adapters/vscode-adapter";
import { ExtensionConfig, jqPathSetting } from "./extension-config";
import { spawnCommandEffect } from "./lib/command-line";
import { renderOutput } from "./renderers";
import * as path from "node:path";

const getEditorText = (editor: vscode.TextEditor): string | undefined =>
  editor ? editor.document.getText() : undefined;

const askFilter = (rememberInput: string) =>
  Effect.gen(function* () {
    const params = {
      prompt: "Enter a jq filter",
      value: rememberInput,
    } as vscode.InputBoxOptions;

    return yield* thenable(() => vscode.window.showInputBox(params));
  });

const insertFilterToJqPlayground = (
  saveFilter: boolean,
  filter: string,
  activeEditor: vscode.TextEditor
) =>
  Effect.gen(function* () {
    if (saveFilter === false) {
      return;
    }
    const document = vscode.workspace.textDocuments.find(
      (doc) => doc.languageId === "jqpg" && doc.isUntitled
    );

    if (document) {
      yield* thenable(() =>
        vscode.window
          .showTextDocument(document, vscode.ViewColumn.Two)
          .then((editor) => {
            editor.edit((editorBuilder) => {
              editorBuilder.insert(
                new vscode.Position(document.lineCount, 0),
                `\n\njq '${filter}'\n${activeEditor.document.fileName}`
              );
            });
            const newPosition = editor.selection.active.with(
              document.lineCount + 4
            );
            const newSelection = new vscode.Selection(newPosition, newPosition);
            editor.selection = newSelection;
          })
      );
    } else {
      yield* thenable(() =>
        vscode.workspace
          .openTextDocument({
            content: `jq '${filter}'\n${activeEditor.document.fileName}`,
            language: "jqpg",
          })
          .then((doc) =>
            vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)
          )
      );
    }
  });

const currentWorkingDirectory = (): string => {
  const cwdActiveFile = Option.fromNullable(vscode.window.activeTextEditor).pipe(
    Option.map((editor) => editor.document.fileName),
    Option.map((fileName) => path.join(fileName, ".."))
  );
  const cwdFirstWorkspace = Option.fromNullable(
    vscode.workspace.workspaceFolders
  ).pipe(
    Option.map((folder) => folder[0].uri.path),
    Option.getOrElse(() => ".")
  );
  return Option.getOrElse(cwdActiveFile, () => cwdFirstWorkspace);
};

export function inputBoxFilter() {
  let rememberInput = "";
  return (saveFilterToPlayground: boolean) =>
    () => Effect.gen(function* () {
      const askResult = yield* askFilter(rememberInput);
      const filter = askResult || ".";

      rememberInput = filter;

      const editorOpt: Option.Option<vscode.TextEditor> = yield* activeTextEditor() as any;
      if (Option.isNone(editorOpt)) {
        return yield* showErrorMessage("Unable to process text editor data");
      }

      const activeEditor: vscode.TextEditor = Option.getOrThrow(editorOpt);
      const json = getEditorText(activeEditor);

      if (!json) {
        return yield* showErrorMessage("Unable to process text editor data");
      }

      const cwd = currentWorkingDirectory();

      yield* insertFilterToJqPlayground(
        saveFilterToPlayground,
        filter,
        activeEditor
      );

      const { jq } = yield* ExtensionConfig;

      const jqExecutablePath = yield* jq.path.pipe(
        Effect.tap((jqPath) =>
          Option.isSome(jqPath)
            ? Effect.succeed(jqPath)
            : Effect.fail(
                `No jq binary path found (${jqPath}). Please configure it in the settings.`
              )
        ),
        Effect.tapError((message) => showErrorMessage(message))
      );

      const jqCommand = spawnCommandEffect(
        Option.getOrElse(jqExecutablePath, () => ""),
        [filter],
        {
          cwd,
        }
      );

      const result = yield* jqCommand(json).pipe(
        Effect.tapError((cause) =>
          showErrorMessage(cause.toString(), "Open Settings").pipe(
            Effect.andThen((userChoice) =>
              userChoice === "Open Settings" ? jqPathSetting() : Effect.void
            )
          )
        )
      );

      renderOutput("output")(result);
    });
}
