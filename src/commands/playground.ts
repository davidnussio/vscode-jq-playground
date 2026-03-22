import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as vscode from "vscode";
import {
  activeTextEditor,
  openTextDocument,
  thenable,
} from "../adapters/vscode-adapter";

const askFilter = (initialValue: string) =>
  thenable(() =>
    vscode.window.showInputBox({
      prompt: "Enter a jq filter",
      value: initialValue,
      placeHolder: ".",
    })
  );

const getEditorText = (): Effect.Effect<string, string> =>
  Effect.gen(function* () {
    const ed = activeTextEditor();
    if (Option.isNone(ed)) {
      return yield* Effect.fail("No active text editor");
    }
    const editor = Option.getOrThrow(ed);
    const text = editor.document.getText(
      editor.selection.isEmpty ? undefined : editor.selection
    );
    if (!text) {
      return yield* Effect.fail("No text in editor");
    }
    return text;
  });

export const createJqpgFromFilter = () =>
  Effect.gen(function* () {
    const filter = yield* askFilter(".");
    const actualFilter = filter || ".";

    const json = yield* getEditorText().pipe(
      Effect.catchAll(() => Effect.succeed("{}"))
    );

    const content = `jq '${actualFilter}'\n${json}`;

    const doc = yield* openTextDocument({
      content,
      language: "jqpg",
    });

    yield* thenable(() =>
      vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)
    );
  });

export const executeJqFromFilter = () =>
  Effect.gen(function* () {
    const filter = yield* askFilter(".");
    if (!filter) {
      return;
    }

    const json = yield* getEditorText();

    // Create a temporary playground and trigger execution
    const content = `jq '${filter}'\n${json}`;

    const doc = yield* openTextDocument({
      content,
      language: "jqpg",
    });

    yield* thenable(() =>
      vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)
    );

    // The CodeLens will be available for the user to execute
    yield* Effect.log(`Created playground with filter: ${filter}`);
  });
