import { Effect, Layer } from 'effect';
import {
  registerCodeLens,
  registerCommand,
  registerCompletionItemProvider,
} from './adapters/vscode-adapter';
import { executeJqCommand, queryRunner } from './commands/execute-query';
import { executeJqInputCommand } from './commands/execute-jq-input-command';
import { openExamples, openManual, openTutorial } from './commands/open-resources';
import { createJqpgFromFilter, executeJqFromFilter } from './commands/playground';
import { LANGUAGES } from './domain/constants';
import { jqQueryLenses } from './providers/code-lens';
import { jqBuiltinsProvider, workspaceFilesProvider } from './providers/completion';

const SetupCommands = Effect.gen(function* () {
  yield* registerCommand('extension.openManual', openManual);
  yield* registerCommand('extension.openTutorial', openTutorial);
  yield* registerCommand('extension.openExamples', openExamples);
  yield* registerCommand('extension.runQueryOutput', queryRunner('output'));
  yield* registerCommand('extension.runQueryEditor', queryRunner('editor'));
  yield* registerCommand('extension.createJqpgFromFilter', createJqpgFromFilter);
  yield* registerCommand('extension.jqpgFromFilter', executeJqFromFilter);
  yield* registerCommand('extension.executeJqCommand', executeJqCommand);
  yield* registerCommand('extension.executeJqInputCommand', executeJqInputCommand);
});

const SetupCodeLens = Effect.gen(function* () {
  yield* registerCodeLens([...LANGUAGES], {
    provideCodeLenses: jqQueryLenses,
  });
});

const SetupCompletionProviders = Effect.gen(function* () {
  yield* registerCompletionItemProvider(['jqpg'], workspaceFilesProvider);
  yield* registerCompletionItemProvider(['jqpg'], jqBuiltinsProvider);
});

export const SetupLive = Effect.gen(function* () {
  yield* SetupCommands;
  yield* SetupCodeLens;
  yield* SetupCompletionProviders;
  yield* Effect.log('Setup complete');
}).pipe(Layer.effectDiscard);
