import * as Effect from 'effect/Effect';
import type * as vscode from 'vscode';
import { launch, VsCodeContext } from './adapters/vscode-adapter';
import { AppLive } from './layers';

export function activate(context: vscode.ExtensionContext) {
  launch(AppLive).pipe(
    Effect.tap(Effect.log('JQ Playground activated')),
    Effect.provideService(VsCodeContext, context),
    Effect.runFork
  );
}

export function deactivate() {
  Effect.runSync(Effect.log('JQ Playground deactivated'));
}
