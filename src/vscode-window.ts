import { window } from "vscode";
import { join } from "path";

// eslint-disable-next-line import/prefer-default-export
export const currentWorkingDirectory = () =>
  join(window.activeTextEditor.document.fileName, "..");
