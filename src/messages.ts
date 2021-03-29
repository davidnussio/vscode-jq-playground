// eslint-disable-next-line no-unused-vars
import * as vscode from "vscode";
import { readFile } from "fs";
import { join } from "path";

function getWebviewContent(
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
): Promise<any> {
  return new Promise((res, rej) => {
    readFile(join(context.extensionPath, "changelog.html"), (err, data) => {
      if (err) {
        panel.webview.html = `<pre>${JSON.stringify(err, null, 2)}</pre>`;
        rej(err);
      }
      panel.webview.html = data.toString();
      res(true);
    });
  });
}

export class Messages {
  static async showWhatsNewMessage(context, version: string) {
    // const actions: MessageItem[] = [{ title: 'Release Notes' }]

    // const result = await window.showInformationMessage(
    //   `
    //   jq playground has been updated (ver. ${version})! Support multiline query and full support for
    //   command line options
    //   `,
    //   ...actions,
    // )

    // if (result === actions[0]) {
    //   await env.openExternal(
    //     Uri.parse(
    //       'https://github.com/davidnussio/vscode-jq-playground/blob/master/CHANGELOG.md',
    //     ),
    //   )
    // }
    console.log(version);

    const panel = vscode.window.createWebviewPanel(
      "jq-changelog",
      `jq Playground ver. ${version}`,
      vscode.ViewColumn.Active,
      {},
    );

    // And set its HTML content
    getWebviewContent(context, panel);
  }
}
