import * as fs from "node:fs";
import * as path from "node:path";
import { Effect } from "effect";
import * as vscode from "vscode";
import {
  activeTextEditor,
  executeCommand,
  openTextDocument,
  showInputBox,
  showTextDocument,
  VsCodeContext,
} from "../adapters/vscode-adapter";
import { FileNotFoundError } from "../domain/errors";

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
      catch: () =>
        new FileNotFoundError({
          path: examplesPath,
          message: `Failed to read examples file: ${examplesPath}`,
        }),
    }).pipe(
      Effect.catchAll(() =>
        Effect.succeed('# No examples file found\njq .\n"hello"')
      )
    );

    const doc = yield* openTextDocument({
      content: fileContent,
      language: "jqpg",
    });

    return yield* showTextDocument(doc, {
      viewColumn: vscode.ViewColumn.Active,
    });
  });

export const openPlay = () =>
  Effect.gen(function* () {
    const editor = yield* activeTextEditor();
    const query = yield* showInputBox({ prompt: "jq query", value: "." });
    if (!query) {
      return;
    }

    const json = editor.document.getText();
    const q = encodeURIComponent(query);
    const j = encodeURIComponent(json);

    yield* executeCommand(
      "vscode.open",
      vscode.Uri.parse(`https://play.jqlang.org?q=${q}&j=${j}`)
    );
  });
