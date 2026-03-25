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

// --- Cached model availability ---

let _hasModels = false;

const refreshModelAvailability = async () => {
  try {
    const models = await vscode.lm.selectChatModels({ vendor: "copilot" });
    _hasModels = models.length > 0;
  } catch {
    _hasModels = false;
  }
};

export const isAiEnabled = (): boolean =>
  getConfigurationValue<boolean>("jqPlayground", "ai.enabled", true);

/** Check both the user setting and actual model availability (sync, cached). */
export const isAiAvailable = (): boolean => isAiEnabled() && _hasModels;

const checkAiAvailable = Effect.gen(function* () {
  if (!isAiEnabled()) {
    return yield* new AiUnavailableError({
      message:
        "AI features are disabled. Enable them in settings: jqPlayground.ai.enabled",
    });
  }
  if (!_hasModels) {
    return yield* new AiUnavailableError({
      message: "No AI model available. Install GitHub Copilot for AI features.",
    });
  }
});

const selectModel = Effect.tryPromise({
  try: async () => {
    const models = await vscode.lm.selectChatModels({ vendor: "copilot" });
    if (!models.length) {
      throw new Error("No AI model available");
    }
    _hasModels = true;
    return models[0];
  },
  catch: () => {
    _hasModels = false;
    return new AiUnavailableError({
      message: "No AI model available. Install GitHub Copilot for AI features.",
    });
  },
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
    // Probe model availability at startup
    yield* Effect.promise(refreshModelAvailability);

    // Re-check when models change (e.g. Copilot installed/uninstalled)
    vscode.lm.onDidChangeChatModels(() => {
      refreshModelAvailability();
    });

    const explainFilter = Effect.fn("AiService.explainFilter")(function* (
      filter: string,
      input?: string
    ) {
      yield* checkAiAvailable;
      const model = yield* selectModel;
      return yield* sendRequest(model, buildExplainPrompt(filter, input));
    });

    const fixError = Effect.fn("AiService.fixError")(function* (
      filter: string,
      error: string,
      input?: string
    ) {
      yield* checkAiAvailable;
      const model = yield* selectModel;
      return yield* sendRequest(model, buildFixPrompt(filter, error, input));
    });

    const generateFilter = Effect.fn("AiService.generateFilter")(function* (
      description: string,
      jsonSample?: string
    ) {
      yield* checkAiAvailable;
      const model = yield* selectModel;
      return yield* sendRequest(
        model,
        buildGeneratePrompt(description, jsonSample)
      );
    });

    const isAvailable = Effect.sync(() => isAiAvailable());

    return { explainFilter, fixError, generateFilter, isAvailable };
  }),
}) {}
