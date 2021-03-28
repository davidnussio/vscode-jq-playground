import * as vscode from "vscode";
import Logger from "./logger";

type RenderOutputType = "output" | "editor";

export const renderOutput = (type: RenderOutputType) => (data: string) => {
  if (type === "editor") {
    vscode.workspace
      .openTextDocument({ content: data, language: "json" })
      .then((doc) =>
        vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside),
      );
  } else {
    Logger.clear();
    Logger.append(data);
    Logger.show(true);
  }
};

export const renderError = (data: string) => {
  Logger.clear();
  Logger.append(data);
  Logger.show(true);
  return vscode.window.showErrorMessage(data);
};
