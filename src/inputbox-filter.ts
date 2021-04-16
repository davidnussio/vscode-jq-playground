import * as vscode from "vscode";
import { spawnCommand } from "./command-line";
import { CONFIGS } from "./configs";
import { renderError, renderOutput } from "./renderers";
import { currentWorkingDirectory } from "./vscode-window";

const getEditorText = (editor: vscode.TextEditor): string =>
  editor ? editor.document.getText() : undefined;

const askFilter = async (rememberInput: string) => {
  const params = {
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
  const document = vscode.workspace.textDocuments.find(
    (doc) => doc.languageId === "jqpg" && doc.isUntitled,
  );

  if (document) {
    return vscode.window
      .showTextDocument(document, vscode.ViewColumn.Two)
      .then((editor) => {
        editor.edit((editorBuilder) => {
          editorBuilder.insert(
            new vscode.Position(document.lineCount, 0),
            `\n\njq '${filter}'\n${activeTextEditor.document.fileName}`,
          );
        });
        const newPosition = editor.selection.active.with(
          document.lineCount + 4,
        );
        const newSelection = new vscode.Selection(newPosition, newPosition);
        // eslint-disable-next-line no-param-reassign
        editor.selection = newSelection;
      });
  }
  return vscode.workspace
    .openTextDocument({
      content: `jq '${filter}'\n${activeTextEditor.document.fileName}`,
      language: "jqpg",
    })

    .then((doc) =>
      vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside),
    );
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function inputBoxFilter() {
  let rememberInput = "";
  return (saveFilterToPlayground: boolean) => async (): Promise<void> => {
    const filter = (await askFilter(rememberInput)) || ".";

    rememberInput = filter;

    const { activeTextEditor } = vscode.window;
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
}
