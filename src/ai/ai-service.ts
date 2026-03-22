import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as vscode from "vscode";
import { getConfigurationValue } from "../adapters/vscode-adapter";
import {
  buildExplainPrompt,
  buildFixPrompt,
  buildGeneratePrompt,
} from "./prompts";

export class AiUnavailableError extends Schema.TaggedError<AiUnavailableError>()(
  "AiUnavailableError",
  { message: Schema.String }
) {}

export const isAiEnabled = (): boolean =>
  getConfigurationValue<boolean>("jqPlayground", "ai.enabled", true);

const checkAiEnabled = Effect.gen(function* () {
  if (!isAiEnabled()) {
    return yield* new AiUnavailableError({
      message:
        "AI features are disabled. Enable them in settings: jqPlayground.ai.enabled",
    });
  }
});

const selectModel = Effect.tryPromise({
  try: async () => {
    const models = await vscode.lm.selectChatModels({ vendor: "copilot" });
    if (!models.length) {
      throw new Error("No AI model available");
    }
    return models[0];
  },
  catch: () =>
    new AiUnavailableError({
      message: "No AI model available. Install GitHub Copilot for AI features.",
    }),
});

const sendRequest = (model: vscode.LanguageModelChat, prompt: string) =>
  Effect.tryPromise({
    try: () => {
      const messages = [vscode.LanguageModelChatMessage.User(prompt)];
      return model.sendRequest(
        messages,
        {},
        new vscode.CancellationTokenSource().token
      );
    },
    catch: (e) => new AiUnavailableError({ message: String(e) }),
  });

export class AiService extends Effect.Service<AiService>()("@jqpg/AiService", {
  effect: Effect.gen(function* () {
    const explainFilter = Effect.fn("AiService.explainFilter")(function* (
      filter: string,
      input?: string
    ) {
      yield* checkAiEnabled;
      const model = yield* selectModel;
      return yield* sendRequest(model, buildExplainPrompt(filter, input));
    });

    const fixError = Effect.fn("AiService.fixError")(function* (
      filter: string,
      error: string,
      input?: string
    ) {
      yield* checkAiEnabled;
      const model = yield* selectModel;
      return yield* sendRequest(model, buildFixPrompt(filter, error, input));
    });

    const generateFilter = Effect.fn("AiService.generateFilter")(function* (
      description: string,
      jsonSample?: string
    ) {
      yield* checkAiEnabled;
      const model = yield* selectModel;
      return yield* sendRequest(
        model,
        buildGeneratePrompt(description, jsonSample)
      );
    });

    const isAvailable = Effect.gen(function* () {
      if (!isAiEnabled()) {
        return false;
      }
      return yield* selectModel.pipe(
        Effect.map(() => true),
        Effect.catchAll(() => Effect.succeed(false))
      );
    });

    return { explainFilter, fixError, generateFilter, isAvailable };
  }),
}) {}
