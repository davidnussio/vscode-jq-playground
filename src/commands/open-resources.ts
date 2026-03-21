import * as fs from "node:fs";
import * as path from "node:path";
import { Effect } from "effect";
import * as vscode from "vscode";
import {
  executeCommand,
  thenable,
  VsCodeContext,
} from "../adapters/vscode-adapter";

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
    yield* Effect.log("Opening examples...");
    const context = yield* VsCodeContext;
    const examplesPath = path.join(
      context.extensionPath,
      "examples",
      "manual.jqpg"
    );

    const fileContent = yield* Effect.try({
      try: () => fs.readFileSync(examplesPath, "utf-8"),
      catch: () => new Error(`Failed to read examples file: ${examplesPath}`),
    }).pipe(
      Effect.catchAll(() =>
        Effect.succeed('# No examples file found\njq .\n"hello"')
      )
    );

    const doc = yield* thenable(() =>
      vscode.workspace.openTextDocument({
        content: fileContent,
        language: "jqpg",
      })
    );

    return yield* thenable(() =>
      vscode.window.showTextDocument(doc, vscode.ViewColumn.Active)
    );
  });
