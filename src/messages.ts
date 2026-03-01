import * as vscode from "vscode";
import { readFile } from "node:fs";
import { join } from "node:path";

// export const 

function getWebviewContent(
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
): Promise<string | true> {
  return new Promise((res, rej) => {
    readFile(join(context.extensionPath, "changelog.html"), (err, data) => {
      if (err) {
        panel.webview.html = `<pre>${JSON.stringify(err, null, 2)}</pre>`;
        rej(err.message);
      }
      panel.webview.html = data.toString();
      res(true);
    });
  });
}

const showWhatsNewMessage = async (
  context: vscode.ExtensionContext,
  version: string,
): Promise<string | true> => {
  const panel = vscode.window.createWebviewPanel(
    "jq-changelog",
    `jq Playground ver. ${version}`,
    vscode.ViewColumn.Active,
    {},
  );

  // And set its HTML content
  return getWebviewContent(context, panel);
};

export default showWhatsNewMessage;
