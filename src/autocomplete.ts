/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import * as vscode from 'vscode'
import { basename } from 'path'

const TYPES: string[] = ['json', 'plaintext', 'jqpg', 'jq']

// jq -n 'builtins | sort | map(split("/")[0]) | unique | map( { (.): {"documentation": ""} }) | add'

// const keywords = Object.keys(builtins).concat([
//   'if',
//   'then',
//   'else',
//   'elif',
//   'end',
// ])

export class WorkspaceFilesCompletionItemProvider
  implements vscode.CompletionItemProvider {
  public async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): Promise<vscode.CompletionItem[]> {
    const completionItems: vscode.CompletionItem[] = vscode.workspace.textDocuments
      .map((doc) => {
        if (TYPES.includes(doc.languageId)) {
          const item = new vscode.CompletionItem(basename(doc.fileName))
          item.kind = vscode.CompletionItemKind.File
          item.insertText = doc.fileName
          return item
        }
        return undefined
      })
      .filter((item) => item)

    return completionItems
  }
}

export class JQLangCompletionItemProvider
  implements vscode.CompletionItemProvider {
  constructor(readonly builtins) {}
  public provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.CompletionList> {
    let prefixRange = document.getWordRangeAtPosition(position)
    if (prefixRange == null) {
      return Promise.resolve(new vscode.CompletionList([], true))
    }
    let prefix = document.getText(prefixRange)

    return new Promise<vscode.CompletionList>((resolve, reject) => {
      resolve(
        new vscode.CompletionList(
          Object.keys(this.builtins)
            .concat(['if', 'then', 'else', 'elif', 'end'])
            .map((keyword) => {
              const item = new vscode.CompletionItem(keyword)
              const { documentation } = this.builtins[keyword] || {}
              if (documentation) {
                item.documentation = new vscode.MarkdownString(documentation)
              }
              item.kind = vscode.CompletionItemKind.Function
              return item
            }),
          true,
        ),
      )
    })
  }
}
