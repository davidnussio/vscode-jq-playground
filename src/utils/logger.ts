import * as Effect from "effect/Effect";
import * as vscode from "vscode";

class LoggerService extends Effect.Service<LoggerService>()("LoggerService", {
  // dependencies: [VsCodeContext],
  scoped: Effect.gen(function* () {
    const channel = yield* Effect.acquireRelease(
      Effect.sync(() => vscode.window.createOutputChannel("jqpg", "json")),
      (channel) => Effect.sync(() => channel.dispose())
    );

    return channel;
  }),
}) {}

export const Logger = vscode.window.createOutputChannel("jqpg", "json");
export const Debug = vscode.window.createOutputChannel("jqpg debug");

export default Logger;
