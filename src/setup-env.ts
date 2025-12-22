import { basename } from "node:path";
import { Effect, Layer } from "effect";
import {
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  MarkdownString,
  workspace,
} from "vscode";
import {
  registerCodeLens,
  registerCommand,
  registerCompletionItemProvider,
} from "./adapters/vscode-adapter";
import { builtins } from "./builtins";

import { jqQueryLenses } from "./code-lens";
import {
  openExamples,
  openManual,
  openTutorial,
} from "./commands/general";
import { inputBoxFilter } from "./commands/inputbox-filter";
import { executeJqCommand, queryRunner } from "./commands/execute-jq-command";

const SetupCommands = Effect.gen(function* () {
  yield* registerCommand("extension.openManual", openManual);
  yield* registerCommand("extension.openTutorial", openTutorial);
  yield* registerCommand("extension.openExamples", openExamples);
  yield* registerCommand("extension.runQueryOutput", queryRunner("output"));
  yield* registerCommand("extension.runQueryEditor", queryRunner("editor"));
  // registerCommand expects a function that returns an Effect.
  // inputBoxFilter(true) returns an Effect.
  // So we need to wrap it in a thunk: () => inputBoxFilter(true)
  yield* registerCommand("extension.createJqpgFromFilter", () => inputBoxFilter(true));
  yield* registerCommand("extension.jqpgFromFilter", () => inputBoxFilter(false));
  yield* registerCommand("extension.executeJqCommand", executeJqCommand);
});

const SetupCodeLens = Effect.gen(function* () {
  yield* registerCodeLens(["jqpg", "jq"], { provideCodeLenses: jqQueryLenses });
});

const SetupCompletionProviders = Effect.gen(function* () {
  const TYPES: string[] = ["json", "plaintext"];

  yield* registerCompletionItemProvider(["jqpg"], {
    provideCompletionItems(document, position, token, context) {
      const completionItems: CompletionItem[] = workspace.textDocuments
        .filter((doc) => TYPES.includes(doc.languageId))
        .map((doc) => {
          const item = new CompletionItem(basename(doc.fileName));
          item.kind = CompletionItemKind.File;
          item.insertText = doc.fileName;
          return item;
        });

      return completionItems;
    },
  });

  yield* registerCompletionItemProvider(["jqpg"], {
    provideCompletionItems(document, position, token, context) {
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
  });
});

export const SetupEnvLive = Effect.gen(function* () {
  yield* SetupCommands;
  yield* SetupCodeLens;
  yield* SetupCompletionProviders;
  yield* Effect.log("Environment setup complete");
}).pipe(Layer.effectDiscard);
