import { Effect } from "effect";
import * as vscode from "vscode";
import { executeCommand, thenable } from "./adapters/vscode-adapter";
import { CONFIGS } from "./configs";

// export function registerCommands(context: vscode.ExtensionContext) {
//   context.subscriptions.push(
//     vscode.commands.registerCommand("extension.openManual", openManual),
//     vscode.commands.registerCommand("extension.openTutorial", openTutorial),
//     vscode.commands.registerCommand("extension.openExamples", openExamples),
//     vscode.commands.registerCommand(
//       "extension.runQueryOutput",
//       runQueryCommand("output"),
//     ),
//     vscode.commands.registerCommand(
//       "extension.runQueryEditor",
//       runQueryCommand("editor"),
//     ),
//     vscode.commands.registerCommand(
//       "extension.createJqpgFromFilter",
//       inputBoxFilterHandler(true),
//     ),
//     vscode.commands.registerCommand(
//       "extension.jqpgFromFilter",
//       inputBoxFilterHandler(false),
//     ),
//   );
// }

export const notImplemented = () => {
  return thenable(() => vscode.window.showErrorMessage("Not implemented yet"));
};

export const openManual = () =>
  executeCommand(
    "vscode.open",
    vscode.Uri.parse("https://stedolan.github.io/jq/manual/")
  );

export const openTutorial = () =>
  executeCommand(
    "vscode.open",
    vscode.Uri.parse("https://stedolan.github.io/jq/tutorial/")
  );

export const openExamples = () =>
  Effect.gen(function* () {
    yield* Effect.log("openExamples", CONFIGS.EXAMPLES_PATH);

    console.log(CONFIGS.EXAMPLES_PATH);
    const fileContent = CONFIGS.EXAMPLES_PATH; // TODO: CONST

    yield* Effect.log("fileContentLength", fileContent.length);

    const refOpenDocument = yield* thenable(() =>
      vscode.workspace.openTextDocument({
        content: fileContent.toString(),
        language: "jqpg",
      })
    );

    const result = yield* thenable(() =>
      vscode.window.showTextDocument(refOpenDocument, vscode.ViewColumn.Active)
    );

    return result;
  });

// export const executeJqCommand = (params: unknown) =>
//   Effect.gen(function* () {
//     yield* Effect.log("executeJqCommand", params);
//   });
