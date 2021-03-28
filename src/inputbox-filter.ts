import * as vscode from "vscode";
import { spawnCommand } from "./command-line";
import { CONFIGS } from "./configs";
import { renderError, renderOutput } from "./renderers";
import { currentWorkingDirectory } from "./vscode-window";

const getEditorText = (editor: vscode.TextEditor): string => {
  return editor ? editor.document.getText() : undefined;
};

const askFilter = async (rememberInput: string) => {
  var params = {
    prompt: "Enter a jq filter",
    value: rememberInput,
  } as vscode.InputBoxOptions;

  return vscode.window.showInputBox(params);
};

const insertFilterToJqPlayground = (
  saveFilter: boolean,
  filter: string,
  activeTextEditor: vscode.TextEditor,
) => {
  if (saveFilter === false) {
    return Promise.resolve();
  }
  let doc = vscode.workspace.textDocuments.find(
    (doc) => doc.languageId === "jqpg" && doc.isUntitled,
  );

  if (doc) {
    return vscode.window
      .showTextDocument(doc, vscode.ViewColumn.Two)
      .then((editor) => {
        editor.edit((editorBuilder) => {
          editorBuilder.insert(
            new vscode.Position(doc.lineCount, 0),
            `\n\njq '${filter}'\n${activeTextEditor.document.fileName}`,
          );
        });
        const newPosition = editor.selection.active.with(doc.lineCount + 4);
        var newSelection = new vscode.Selection(newPosition, newPosition);
        editor.selection = newSelection;
      });
  } else {
    return vscode.workspace
      .openTextDocument({
        content: `jq '${filter}'\n${activeTextEditor.document.fileName}`,
        language: "jqpg",
      })

      .then((doc) =>
        vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside),
      );
  }
};

export const inputBoxFilter = () => {
  let rememberInput = "";
  return (saveFilterToPlayground: boolean) => {
    return async (): Promise<void> => {
      const filter = await askFilter(rememberInput);

      const activeTextEditor = vscode.window.activeTextEditor;
      const json = getEditorText(activeTextEditor);

      if (!json) {
        vscode.window.showErrorMessage("Unable to process text editor data");
        return;
      }

      try {
        const cwd = currentWorkingDirectory();

        await insertFilterToJqPlayground(
          saveFilterToPlayground,
          filter,
          activeTextEditor,
        );

        spawnCommand(
          CONFIGS.FILEPATH,
          [filter],
          {
            cwd,
          },
          json,
        ).fork(renderError, renderOutput(null));
      } catch (e) {
        vscode.window.showErrorMessage(e.message);
      }
    };
  };
};
