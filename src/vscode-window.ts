import * as vscode from "vscode";
import { join } from "path";

// eslint-disable-next-line import/prefer-default-export
export const currentWorkingDirectory = () => {
  const cwd = join(vscode.window.activeTextEditor.document.fileName, "..");
  return cwd || vscode.workspace.workspaceFolders[0].uri.path;
};
