import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as vscode from "vscode";
import {
  activeTextEditor,
  openTextDocument,
  showInputBox,
  showTextDocument,
  showWarningMessage,
} from "../adapters/vscode-adapter";

const askFilter = (initialValue: string) =>
  showInputBox({
    prompt: "Enter a jq filter",
    value: initialValue,
    placeHolder: ".",
  });

/** Selected text of the active editor, or the whole document if nothing is selected. */
const getEditorText = (): Option.Option<string> =>
  activeTextEditor().pipe(
    Option.map((editor) =>
      editor.document.getText(
        editor.selection.isEmpty ? undefined : editor.selection
      )
    ),
    Option.filter((text) => text !== "")
  );

export const createJqpgFromFilter = () =>
  Effect.gen(function* () {
    const filter = yield* askFilter(".");
    const actualFilter = filter || ".";

    const json = Option.getOrElse(getEditorText(), () => "{}");

    const content = `jq '${actualFilter}'\n${json}`;

    const doc = yield* openTextDocument({
      content,
      language: "jqpg",
    });

    yield* showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
  });

export const executeJqFromFilter = () =>
  Effect.gen(function* () {
    const filter = yield* askFilter(".");
    if (!filter) {
      return;
    }

    const editorText = getEditorText();
    if (Option.isNone(editorText)) {
      yield* showWarningMessage("No text found in the active editor.");
      return;
    }
    const json = editorText.value;

    // Create a temporary playground and trigger execution
    const content = `jq '${filter}'\n${json}`;

    const doc = yield* openTextDocument({
      content,
      language: "jqpg",
    });

    yield* showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });

    // The CodeLens will be available for the user to execute
    yield* Effect.log(`Created playground with filter: ${filter}`);
  });
