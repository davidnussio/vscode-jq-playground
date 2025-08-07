import { basename } from "path";
import * as vscode from "vscode";
import { workspace } from "vscode";

type Builtins = { [key: string]: { ["documentation"]: string } };

const TYPES: string[] = ["json", "plaintext"];

// jq -n 'builtins | sort | map(split("/")[0]) | unique | map( { (.): {"documentation": ""} }) | add'

// const keywords = Object.keys(builtins).concat([
//   'if',
//   'then',
//   'else',
//   'elif',
//   'end',
// ])

export function workspaceFilesCompletionItemProvider() {
  const TYPES: string[] = ["json", "plaintext"];
  return vscode.languages.registerCompletionItemProvider("jqpg", {
    provideCompletionItems(
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken,
      context: vscode.CompletionContext
    ) {
      const completionItems: vscode.CompletionItem[] = workspace.textDocuments
        .filter((doc) => TYPES.includes(doc.languageId))
        .map((doc) => {
          const item = new vscode.CompletionItem(basename(doc.fileName));
          item.kind = vscode.CompletionItemKind.File;
          item.insertText = doc.fileName;
          return item;
        });

      return completionItems;
    },
  });
}

export function jqLangCompletionItemProvider(builtins: Builtins) {
  return vscode.languages.registerCompletionItemProvider("jqpg", {
    provideCompletionItems(
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken,
      context: vscode.CompletionContext
    ) {
      return new vscode.CompletionList(
        Object.keys(builtins)
          .concat(["if", "then", "else", "elif", "end"])
          .map((keyword) => {
            const item = new vscode.CompletionItem(keyword);
            const { documentation } = builtins[keyword] || {};
            if (documentation) {
              item.documentation = new vscode.MarkdownString(documentation);
            }
            item.kind = vscode.CompletionItemKind.Function;
            return item;
          }),
        true
      );
    },
  });
}

// TODO: add command options to vscode but now introduce twice --
// export function jqOptionsCompletionItemProvider() {
//   return vscode.languages.registerCompletionItemProvider("jqpg", {
//     provideCompletionItems(
//       document: vscode.TextDocument,
//       position: vscode.Position,
//       token: vscode.CancellationToken,
//       context: vscode.CompletionContext,
//     ) {
//       const linePrefix = document
//         .lineAt(position)
//         .text.substr(0, position.character);
//       if (!linePrefix.endsWith("--")) {
//         return undefined;
//       }

//       return [
//         new vscode.CompletionItem(
//           "--raw-input",
//           vscode.CompletionItemKind.Constant,
//         ),
//       ];
//     },
//   });
// }
