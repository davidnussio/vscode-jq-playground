import * as Effect from "effect/Effect";
import * as vscode from "vscode";
import {
  openTextDocument,
  showWarningMessage,
  thenable,
} from "../adapters/vscode-adapter";
import { AiService, AiUnavailableError } from "./ai-service";

// --- Streaming helper ---

const AI_LOADING_HEADER = "✨ *Generating response…*\n\n---\n\n";

const streamToEditor = (response: vscode.LanguageModelChatResponse) =>
  Effect.gen(function* () {
    const doc = yield* openTextDocument({
      content: AI_LOADING_HEADER,
      language: "markdown",
    });
    const editor = yield* thenable(() =>
      vscode.window.showTextDocument(doc, {
        viewColumn: vscode.ViewColumn.Beside,
        preview: true,
      })
    );

    yield* Effect.tryPromise({
      try: async () => {
        let firstChunk = true;
        for await (const chunk of response.text) {
          await editor.edit(
            (edit) => {
              if (firstChunk) {
                // Replace the loading placeholder with actual content
                const fullRange = new vscode.Range(
                  new vscode.Position(0, 0),
                  doc.lineAt(doc.lineCount - 1).range.end
                );
                edit.replace(fullRange, chunk);
                firstChunk = false;
              } else {
                const endPos = doc.lineAt(doc.lineCount - 1).range.end;
                edit.insert(endPos, chunk);
              }
            },
            { undoStopBefore: false, undoStopAfter: false }
          );
        }
      },
      catch: (e) =>
        new AiUnavailableError({ message: `Stream error: ${String(e)}` }),
    });
  });

const collectResponseText = (response: vscode.LanguageModelChatResponse) =>
  Effect.tryPromise({
    try: async () => {
      const parts: string[] = [];
      for await (const chunk of response.text) {
        parts.push(chunk);
      }
      return parts.join("");
    },
    catch: (e) =>
      new AiUnavailableError({ message: `Stream error: ${String(e)}` }),
  });

// --- Helpers ---

const getActiveEditorJsonSample = (): string | undefined => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return undefined;
  }
  const doc = editor.document;
  if (doc.languageId === "json" || doc.languageId === "jsonc") {
    return doc.getText().slice(0, 500);
  }
  return undefined;
};

const showUnavailableWarning = showWarningMessage(
  "No AI model available. Install GitHub Copilot for AI features."
);

// --- Commands ---

export const explainFilterCommand = (filter: string, input?: string) =>
  Effect.gen(function* () {
    const ai = yield* AiService;
    const response = yield* ai.explainFilter(filter, input);
    yield* streamToEditor(response);
  }).pipe(Effect.catchTag("AiUnavailableError", () => showUnavailableWarning));

export const fixErrorCommand = (
  filter: string,
  errorMessage: string,
  input?: string
) =>
  Effect.gen(function* () {
    const ai = yield* AiService;
    const response = yield* ai.fixError(filter, errorMessage, input);
    yield* streamToEditor(response);
  }).pipe(Effect.catchTag("AiUnavailableError", () => showUnavailableWarning));

export const generateFilterCommand = () =>
  Effect.gen(function* () {
    const description = yield* thenable(() =>
      vscode.window.showInputBox({
        prompt: "Describe what you want to do with the JSON",
        placeHolder: 'e.g. "extract all names where active is true"',
      })
    );

    if (!description) {
      return;
    }

    const ai = yield* AiService;
    const jsonSample = getActiveEditorJsonSample();
    const response = yield* ai.generateFilter(
      description,
      jsonSample ?? undefined
    );

    // generateFilter needs the full text to insert into a .jqpg block
    const filter = (yield* collectResponseText(response)).trim();

    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === "jqpg") {
      const lastLine = editor.document.lineCount - 1;
      const lastChar = editor.document.lineAt(lastLine).text.length;
      yield* thenable(() =>
        editor.edit((editBuilder) => {
          editBuilder.insert(
            new vscode.Position(lastLine, lastChar),
            `\n\njq '${filter}'\n${jsonSample ?? "{}"}`
          );
        })
      );
    } else {
      const content = `jq '${filter}'\n${jsonSample ?? "{}"}`;
      const doc = yield* openTextDocument({ content, language: "jqpg" });
      yield* thenable(() =>
        vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)
      );
    }
  }).pipe(Effect.catchTag("AiUnavailableError", () => showUnavailableWarning));
