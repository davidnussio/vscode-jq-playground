import { Effect, Option, pipe } from "effect";
import * as vscode from "vscode";
import {
  activeTextEditor,
  showErrorMessage,
  thenable,
} from "../adapters/vscode-adapter";
import { CONFIGS } from "../config/configs";
import { spawnCommandEffect } from "../utils/command-line";
import { renderError, renderOutput } from "../utils/renderers";

// Re-implementing currentWorkingDirectory locally or fetching from where it was (it seemed missing)
const currentWorkingDirectory = () => {
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    return vscode.workspace.workspaceFolders[0].uri.fsPath;
  }
  return process.cwd();
};

const getEditorText = (editor: vscode.TextEditor): string =>
  editor ? editor.document.getText() : "";

const askFilter = (rememberInput: string) =>
  Effect.gen(function* () {
    const params: vscode.InputBoxOptions = {
      prompt: "Enter a jq filter",
      value: rememberInput,
    };
    return yield* thenable(() => vscode.window.showInputBox(params));
  });

const insertFilterToJqPlayground = (
  saveFilter: boolean,
  filter: string,
  activeTextEditor: vscode.TextEditor
) =>
  Effect.gen(function* () {
    if (!saveFilter) {
      return;
    }

    const document = vscode.workspace.textDocuments.find(
      (doc) => doc.languageId === "jqpg" && doc.isUntitled
    );

    if (document) {
      const editor = yield* thenable(() =>
        vscode.window.showTextDocument(document, vscode.ViewColumn.Two)
      );
      yield* thenable(() =>
        editor.edit((editorBuilder) => {
          editorBuilder.insert(
            new vscode.Position(document.lineCount, 0),
            `\n\njq '${filter}'\n${activeTextEditor.document.fileName}`
          );
        })
      );
      const newPosition = editor.selection.active.with(document.lineCount + 4);
      const newSelection = new vscode.Selection(newPosition, newPosition);
      editor.selection = newSelection;
    } else {
      const doc = yield* thenable(() =>
        vscode.workspace.openTextDocument({
          content: `jq '${filter}'\n${activeTextEditor.document.fileName}`,
          language: "jqpg",
        })
      );
      yield* thenable(() =>
        vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)
      );
    }
  });

export const inputBoxFilter = (saveFilterToPlayground: boolean) => {
    let rememberInput = "";

    return Effect.gen(function* () {
        const filterOption = yield* askFilter(rememberInput).pipe(
            Effect.map(Option.fromNullable)
        );

        const filter = Option.getOrElse(filterOption, () => ".");

        rememberInput = filter;

        const editorOption = activeTextEditor();
        const editor = Option.getOrUndefined(editorOption);

        if (!editor) {
             yield* showErrorMessage("Unable to process text editor data");
             return;
        }

        const json = getEditorText(editor);

        if (!json) {
            yield* showErrorMessage("Unable to process text editor data");
            return;
        }

        const cwd = currentWorkingDirectory();

        yield* insertFilterToJqPlayground(
            saveFilterToPlayground,
            filter,
            editor
        );

        const commandEffect = spawnCommandEffect(
            CONFIGS.FILEPATH,
            [filter],
            { cwd }
        )(json);

        yield* commandEffect.pipe(
            Effect.match({
                onFailure: (error) => renderError(error),
                onSuccess: (output) => renderOutput("output")(output)
            })
        );
    });
};
