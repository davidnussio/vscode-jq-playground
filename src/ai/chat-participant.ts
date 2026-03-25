import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as vscode from "vscode";
import { activeTextEditor, VsCodeContext } from "../adapters/vscode-adapter";
import { JQ_QUERY_REGEX } from "../domain/constants";
import { buildChatSystemPrompt } from "./prompts";

// --- Context helpers ---

const JQ_PREFIX_REGEX = /^jq\s+/;

const getActiveFilterAtCursor = (): string | undefined => {
  const ed = activeTextEditor();
  if (Option.isNone(ed)) {
    return undefined;
  }
  const editor = Option.getOrThrow(ed);
  if (editor.document.languageId !== "jqpg") {
    return undefined;
  }
  const line = editor.selection.active.line;
  // Walk backwards to find the jq line
  for (let i = line; i >= 0; i--) {
    const text = editor.document.lineAt(i).text;
    if (JQ_QUERY_REGEX.test(text)) {
      return text.replace(JQ_PREFIX_REGEX, "").trim();
    }
  }
  return undefined;
};

const getActiveInputSample = (): string | undefined => {
  const ed = activeTextEditor();
  if (Option.isNone(ed)) {
    return undefined;
  }
  const editor = Option.getOrThrow(ed);
  const doc = editor.document;
  if (doc.languageId === "json" || doc.languageId === "jsonc") {
    return doc.getText().slice(0, 500);
  }
  // For jqpg files, try to find the input section after the jq line
  if (doc.languageId === "jqpg") {
    const line = editor.selection.active.line;
    for (let i = line; i >= 0; i--) {
      if (JQ_QUERY_REGEX.test(doc.lineAt(i).text)) {
        // Input starts on the next line after the jq command
        const inputStart = i + 1;
        if (inputStart < doc.lineCount) {
          const lines: string[] = [];
          for (
            let j = inputStart;
            j < doc.lineCount && !JQ_QUERY_REGEX.test(doc.lineAt(j).text);
            j++
          ) {
            lines.push(doc.lineAt(j).text);
          }
          return lines.join("\n").slice(0, 500);
        }
        break;
      }
    }
  }
  return undefined;
};

export const registerChatParticipant = Effect.gen(function* () {
  const context = yield* VsCodeContext;

  const participant = vscode.chat.createChatParticipant(
    "jqpg.assistant",
    async (request, _context, response, token) => {
      const models = await vscode.lm.selectChatModels({ vendor: "copilot" });
      if (!models.length) {
        response.markdown(
          "No AI model available. Install GitHub Copilot for AI features."
        );
        return;
      }
      const model = models[0];

      const activeFilter = getActiveFilterAtCursor();
      const activeInput = getActiveInputSample();
      const systemPrompt = buildChatSystemPrompt(activeFilter, activeInput);

      const messages = [
        vscode.LanguageModelChatMessage.User(
          `${systemPrompt}\n\nUser question: ${request.prompt}`
        ),
      ];

      const chatResponse = await model.sendRequest(messages, {}, token);
      for await (const chunk of chatResponse.text) {
        response.markdown(chunk);
      }
    }
  );

  participant.iconPath = vscode.Uri.joinPath(context.extensionUri, "icon.png");

  context.subscriptions.push(participant);
});
