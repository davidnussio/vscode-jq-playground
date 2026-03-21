import * as fs from 'node:fs';
import * as path from 'node:path';
import * as Effect from 'effect/Effect';
import * as vscode from 'vscode';
import type { OutputTarget } from '../domain/models';

export class OutputRendererService extends Effect.Service<OutputRendererService>()(
  '@jqpg/OutputRendererService',
  {
    scoped: Effect.gen(function* () {
      const outputChannel = yield* Effect.acquireRelease(
        Effect.sync(() =>
          vscode.window.createOutputChannel('jqpg', 'json')
        ),
        (ch) => Effect.sync(() => ch.dispose())
      );

      const render = Effect.fn('OutputRendererService.render')(function* (
        result: string,
        target: OutputTarget,
        cwd: string
      ) {
        switch (target._tag) {
          case 'ConsoleOutput': {
            outputChannel.clear();
            outputChannel.append(result);
            outputChannel.show(true);
            break;
          }
          case 'EditorOutput': {
            const doc = yield* Effect.promise(() =>
              vscode.workspace.openTextDocument({
                content: result,
                language: 'json',
              })
            );
            yield* Effect.promise(() =>
              vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)
            );
            break;
          }
          case 'FileOutput': {
            const filePath = path.isAbsolute(target.path)
              ? target.path
              : path.resolve(cwd, target.path);
            yield* Effect.sync(() => fs.writeFileSync(filePath, result));
            yield* Effect.log(`Output written to: ${filePath}`);
            break;
          }
          case 'FileAppendOutput': {
            const filePath = path.isAbsolute(target.path)
              ? target.path
              : path.resolve(cwd, target.path);
            yield* Effect.sync(() => fs.appendFileSync(filePath, result));
            yield* Effect.log(`Output appended to: ${filePath}`);
            break;
          }
        }
      });

      const renderError = Effect.fn(
        'OutputRendererService.renderError'
      )(function* (message: string) {
        outputChannel.clear();
        outputChannel.append(message);
        outputChannel.show(true);
        yield* Effect.promise(() =>
          vscode.window.showErrorMessage(message)
        );
      });

      return { render, renderError };
    }),
  }
) {}
