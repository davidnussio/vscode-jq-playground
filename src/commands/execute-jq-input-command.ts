import * as fs from 'node:fs';
import * as path from 'node:path';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import { window, workspace } from 'vscode';
import { JqExecutionService } from '../services/JqExecutionService';

/**
 * Command for VS Code task input variables integration.
 * Receives { filter: string, input: string } and returns the jq result.
 * Used in tasks.json as:
 *   "command": "extension.executeJqInputCommand",
 *   "args": { "filter": ".endpoints.api", "input": "./config.json" }
 */
export const executeJqInputCommand = (args?: {
  filter?: string;
  input?: string;
}) =>
  Effect.gen(function* () {
    const filter = args?.filter ?? '.';
    const inputPath = args?.input;

    const jqExecution = yield* JqExecutionService;

    const cwd = pipe(
      Option.fromNullable(workspace.workspaceFolders),
      Option.map((folders) => folders[0].uri.fsPath),
      Option.getOrElse(() => '.')
    );

    let inputData: string | undefined;

    if (inputPath) {
      const resolvedPath = path.isAbsolute(inputPath)
        ? inputPath
        : path.resolve(cwd, inputPath);

      inputData = yield* Effect.try({
        try: () => fs.readFileSync(resolvedPath, 'utf-8'),
        catch: () => new Error(`Failed to read input file: ${resolvedPath}`),
      }).pipe(
        Effect.catchAll(() => {
          // Try as inline JSON
          return Effect.succeed(inputPath);
        })
      );
    } else {
      // Use active editor content
      const editor = window.activeTextEditor;
      if (editor) {
        inputData = editor.document.getText();
      }
    }

    const result = yield* jqExecution.execute(
      [filter],
      inputData,
      { cwd }
    );

    return result;
  });
