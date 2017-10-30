import * as vscode from 'vscode';

const TYPES:Array<string> = ['ĵson', 'plaintext', 'jq'];

export class WorkspaceFilesCompletionItemProvider implements vscode.CompletionItemProvider {
    public async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.CompletionItem[]> {
        const completionItems: vscode.CompletionItem[] = vscode.workspace.textDocuments
            .map(document => {
                if (TYPES.includes(document.languageId)) {
                    return new vscode.CompletionItem(
                        document.fileName,
                        vscode.CompletionItemKind.File
                    );
                }
            })
            .filter(item => item);

        return completionItems;
    }
}