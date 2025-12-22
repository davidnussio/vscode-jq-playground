import { FetchHttpClient } from "@effect/platform";
// import { NodeContext } from "@effect/platform-node";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type * as vscode from "vscode";
import { launch, logger, VsCodeContext } from "./adapters/vscode-adapter";
import { ExtensionConfig } from "./config/extension-config";
import { SetupEnvLive } from "./setup-env";

const MainLive = Layer.mergeAll(SetupEnvLive).pipe(
  Layer.provide(logger("JQ Playground")),
  Layer.provide(ExtensionConfig.Default),
  Layer.provide(FetchHttpClient.layer)
  // Layer.provide(NodeContext.layer)
);

export function activate(context: vscode.ExtensionContext) {
  launch(MainLive).pipe(
    Effect.tap(Effect.log("Effect Dev Tools activated")),
    Effect.provideService(VsCodeContext, context),
    Effect.runFork
  );
}

export function deactivate() {
  Effect.runSync(Effect.log("Effect Dev Tools deactivated"));
}
