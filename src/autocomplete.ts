import * as vscode from "vscode";

const TYPES: string[] = ["json", "plaintext", "jq"];

export class WorkspaceFilesCompletionItemProvider implements vscode.CompletionItemProvider {
  public async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.CompletionItem[]> {
    const completionItems: vscode.CompletionItem[] = vscode.workspace.textDocuments
      .map((doc) => {
        if (TYPES.includes(doc.languageId)) {
          return new vscode.CompletionItem(doc.fileName, vscode.CompletionItemKind.File);
        }
      })
      .filter((item) => item);

    return completionItems;
  }
}
