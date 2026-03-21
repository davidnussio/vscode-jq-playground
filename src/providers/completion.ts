import { basename } from "node:path";
import {
  CompletionItem,
  CompletionItemKind,
  type CompletionItemProvider,
  CompletionList,
  MarkdownString,
  workspace,
} from "vscode";
import { builtins } from "../builtins";

const FILE_TYPES = ["json", "plaintext"];

export const workspaceFilesProvider: CompletionItemProvider = {
  provideCompletionItems() {
    return workspace.textDocuments
      .filter((doc) => FILE_TYPES.includes(doc.languageId))
      .map((doc) => {
        const item = new CompletionItem(basename(doc.fileName));
        item.kind = CompletionItemKind.File;
        item.insertText = doc.fileName;
        return item;
      });
  },
};

export const jqBuiltinsProvider: CompletionItemProvider = {
  provideCompletionItems() {
    return new CompletionList(
      Object.entries(builtins).map(([keyword, { documentation }]) => {
        const item = new CompletionItem(keyword);
        if (documentation) {
          item.documentation = new MarkdownString(documentation);
        }
        item.kind = CompletionItemKind.Function;
        return item;
      }),
      true
    );
  },
};
