import { Effect, Layer } from "effect";
import {
  registerCodeLens,
  registerCommand,
  registerCompletionItemProvider,
  registerWebviewViewProvider,
} from "./adapters/vscode-adapter";
import { explainFilterCommand, generateFilterCommand } from "./ai/ai-commands";
import { registerChatParticipant } from "./ai/chat-participant";
import { executeJqInputCommand } from "./commands/execute-jq-input-command";
import { executeJqCommand, queryRunner } from "./commands/execute-query";
import {
  openExamples,
  openManual,
  openPlay,
  openTutorial,
} from "./commands/open-resources";
import {
  createJqpgFromFilter,
  executeJqFromFilter,
} from "./commands/playground";
import { LANGUAGES } from "./domain/constants";
import { jqQueryLenses } from "./providers/code-lens";
import {
  jqBuiltinsProvider,
  workspaceFilesProvider,
} from "./providers/completion";
import {
  openPlaygroundPanel,
  playgroundViewProvider,
} from "./providers/playground-panel";
import {
  configureJqPathCommand,
  downloadJqBinaryCommand,
} from "./services/jq-binary-service";

const SetupCommands = Effect.gen(function* () {
  yield* registerCommand("extension.openManual", openManual);
  yield* registerCommand("extension.openTutorial", openTutorial);
  yield* registerCommand("extension.openExamples", openExamples);
  yield* registerCommand("extension.openPlay", openPlay);
  yield* registerCommand("extension.runQueryOutput", queryRunner("output"));
  yield* registerCommand("extension.runQueryEditor", queryRunner("editor"));
  yield* registerCommand(
    "extension.createJqpgFromFilter",
    createJqpgFromFilter
  );
  yield* registerCommand("extension.jqpgFromFilter", executeJqFromFilter);
  yield* registerCommand("jqpg.openPlaygroundPanel", openPlaygroundPanel);
  yield* registerCommand("extension.executeJqCommand", executeJqCommand);
  yield* registerCommand(
    "extension.executeJqInputCommand",
    executeJqInputCommand
  );
  yield* registerCommand(
    "extension.configureJqPath",
    () => configureJqPathCommand
  );
  yield* registerCommand(
    "extension.downloadJqBinary",
    () => downloadJqBinaryCommand
  );

  // AI commands
  yield* registerCommand("jqpg.ai.explainFilter", explainFilterCommand);
  yield* registerCommand("jqpg.ai.generateFilter", generateFilterCommand);
});

const SetupCodeLens = Effect.gen(function* () {
  yield* registerCodeLens([...LANGUAGES], {
    provideCodeLenses: jqQueryLenses,
  });
});

const SetupCompletionProviders = Effect.gen(function* () {
  yield* registerCompletionItemProvider(["jqpg"], workspaceFilesProvider);
  yield* registerCompletionItemProvider(["jqpg"], jqBuiltinsProvider);
});

const SetupChatParticipant = Effect.gen(function* () {
  yield* registerChatParticipant;
});

const SetupSidebarView = Effect.gen(function* () {
  const provider = yield* playgroundViewProvider;
  yield* registerWebviewViewProvider("jqpg.playgroundView", provider);
});

export const SetupLive = Effect.gen(function* () {
  yield* SetupCommands;
  yield* SetupCodeLens;
  yield* SetupCompletionProviders;
  yield* SetupChatParticipant;
  yield* SetupSidebarView;
  yield* Effect.log("Setup complete");
}).pipe(Layer.effectDiscard);
