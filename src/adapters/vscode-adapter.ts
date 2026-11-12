import { pipe } from "effect";
import * as Context from "effect/Context";
import type * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as Option from "effect/Option";
import * as Scope from "effect/Scope";
import * as Stream from "effect/Stream";
import * as SubscriptionRef from "effect/SubscriptionRef";
import * as vscode from "vscode";

export class VsCodeContext extends Context.Service<
  VsCodeContext,
  vscode.ExtensionContext
>()("vscode/ExtensionContext") {}

export const thenable = <A>(f: () => Thenable<A>) =>
  Effect.callback<A>((resume) => {
    f().then(
      (_) => resume(Effect.succeed(_)),
      (err) => resume(Effect.die(err))
    );
  });

// biome-ignore lint/suspicious/noExplicitAny: vscode executeCommand API expects any
export const executeCommand = (command: string, ...args: Array<any>) =>
  thenable(() => vscode.commands.executeCommand(command, ...args));

export const showErrorMessage = <T extends string>(
  message: string,
  ...items: T[]
) => thenable(() => vscode.window.showErrorMessage(message, ...items));

export const showWarningMessage = <T extends string>(
  message: string,
  ...items: T[]
) => thenable(() => vscode.window.showWarningMessage(message, ...items));

export const showInformationMessage = <T extends string>(
  message: string,
  ...items: T[]
) => thenable(() => vscode.window.showInformationMessage(message, ...items));

export const registerCommand = <R, E, A>(
  command: string,
  // biome-ignore lint/suspicious/noExplicitAny: vscode command args are untyped
  f: (...args: Array<any>) => Effect.Effect<A, E, R>,
  options?: {
    /**
     * Hand the command's result back to the caller of `executeCommand`
     * (e.g. task input variables). Off by default so callers do not wait on
     * notifications the command shows. Failures resolve to undefined.
     */
    readonly returnResult?: boolean;
  }
) =>
  Effect.gen(function* () {
    const context = yield* VsCodeContext;
    const services = yield* Effect.context<R>();
    const runFork = Effect.runForkWith(services);
    const runPromise = Effect.runPromiseWith(services);

    context.subscriptions.push(
      vscode.commands.registerCommand(command, (...args) => {
        const effect = f(...args).pipe(
          Effect.catchCause(Effect.log),
          Effect.annotateLogs({ command })
        );
        if (options?.returnResult) {
          return runPromise(effect);
        }
        runFork(effect);
      })
    );
  });

export const registerCodeLens = (
  languages: string[],
  provider: vscode.CodeLensProvider
) =>
  Effect.gen(function* () {
    const context = yield* VsCodeContext;
    context.subscriptions.push(
      vscode.languages.registerCodeLensProvider(languages, provider)
    );
  });

export const registerCompletionItemProvider = (
  languages: string[],
  provider: vscode.CompletionItemProvider
) =>
  Effect.gen(function* () {
    const context = yield* VsCodeContext;
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(languages, provider)
    );
  });

export const registerWebviewViewProvider = (
  viewId: string,
  provider: vscode.WebviewViewProvider
) =>
  Effect.gen(function* () {
    const context = yield* VsCodeContext;
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(viewId, provider, {
        webviewOptions: { retainContextWhenHidden: true },
      })
    );
  });

export const activeTextEditor = () =>
  Option.fromNullishOr(vscode.window.activeTextEditor);

export const openTextDocument = (options: {
  content?: string;
  language?: string;
}) => thenable(() => vscode.workspace.openTextDocument(options));

export const showTextDocument = (
  document: vscode.TextDocument,
  options?: vscode.TextDocumentShowOptions
) => thenable(() => vscode.window.showTextDocument(document, options));

export const showInputBox = (options?: vscode.InputBoxOptions) =>
  thenable(() => vscode.window.showInputBox(options));

export const createOutputChannel = (name: string, languageId: string) =>
  Effect.sync(() => vscode.window.createOutputChannel(name, languageId));

export const getConfigurationValue = <A>(
  namespace: string,
  setting: string,
  defaultValue: A
): A =>
  vscode.workspace.getConfiguration(namespace).get<A>(setting, defaultValue);

export interface ConfigRef<A, B = A> {
  readonly changes: Stream.Stream<A>;
  readonly get: Effect.Effect<A>;
  readonly update: (value: B) => Effect.Effect<void, never, never>;
}

export const config = <A>(
  namespace: string,
  setting: string,
  emptyValueAsNone = false
): Effect.Effect<ConfigRef<Option.Option<A>, A>, never, Scope.Scope> =>
  Effect.gen(function* () {
    const get = () => {
      const value = vscode.workspace
        .getConfiguration(namespace)
        .get<A>(setting);
      return emptyValueAsNone && typeof value === "string" && value === ""
        ? Option.none()
        : Option.fromNullishOr(value);
    };

    const update = (value: A) =>
      thenable(() =>
        vscode.workspace
          .getConfiguration(namespace)
          .update(setting, value, true)
      ).pipe(
        Effect.andThen(SubscriptionRef.set(ref, Option.fromNullishOr(value)))
      );

    const ref = yield* SubscriptionRef.make<Option.Option<A>>(get());

    yield* listenFork(vscode.workspace.onDidChangeConfiguration, (event) =>
      event.affectsConfiguration(`${namespace}.${setting}`)
        ? pipe(
            Effect.log("Configuration changed", namespace, setting, get()),
            Effect.andThen(SubscriptionRef.set(ref, get()))
          )
        : Effect.void
    );
    return {
      get: SubscriptionRef.get(ref),
      changes: Stream.changes(SubscriptionRef.changes(ref)),
      update,
    };
  });

export const listen = <A, R>(
  event: vscode.Event<A>,
  f: (data: A) => Effect.Effect<void, never, R>
): Effect.Effect<never, never, R> =>
  Effect.flatMap(Effect.context<R>(), (services) =>
    Effect.callback<never>((_resume) => {
      const run = Effect.runForkWith(services);
      const d = event((data) =>
        run(
          Effect.catchCause(f(data), (_) =>
            Effect.log("unhandled defect in event listener", _)
          )
        )
      );
      return Effect.sync(() => {
        d.dispose();
      });
    })
  );

export const listenFork = <A, R>(
  event: vscode.Event<A>,
  f: (data: A) => Effect.Effect<void, never, R>
) => Effect.forkScoped(listen(event, f));

/**
 * Wraps an Effect in a VS Code progress notification with cancellation support.
 * The notification only appears after `delay` (default 2s) to avoid flashing
 * on fast operations. When the user clicks Cancel, the fiber is interrupted,
 * which propagates to all child processes via AbortSignal in Effect.callback.
 */
export const withProgress = <A, E, R>(
  title: string,
  effect: Effect.Effect<A, E, R>,
  delay: Duration.Input = "2 seconds"
): Effect.Effect<A, E, R> =>
  Effect.gen(function* () {
    const fiber = yield* Effect.forkChild(effect);

    // Wait for the fiber to complete within the delay
    const fast = yield* Fiber.join(fiber).pipe(Effect.timeoutOption(delay));

    if (Option.isSome(fast)) {
      return fast.value;
    }

    // Still running — show progress and wait for completion
    return yield* Effect.callback<A, E>((resume) => {
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title,
          cancellable: true,
        },
        (_progress, token) =>
          new Promise<void>((resolvePromise) => {
            const tokenDispose = token.onCancellationRequested(() => {
              Effect.runFork(Fiber.interrupt(fiber));
            });

            Effect.runCallback(Fiber.join(fiber), {
              onExit: (exit) => {
                tokenDispose.dispose();
                resolvePromise();
                resume(exit);
              },
            });
          })
      );
    });
  });

export const launch = <E>(layer: Layer.Layer<never, E, VsCodeContext>) =>
  Effect.gen(function* () {
    const context = yield* VsCodeContext;
    const scope = yield* Scope.make();
    context.subscriptions.push({
      dispose: () => Effect.runFork(Scope.close(scope, Exit.void)),
    });
    yield* Layer.buildWithScope(layer, scope);
  }).pipe(Effect.catchCause(Effect.logFatal));

export const logger = (name: string) =>
  Logger.layer([
    Effect.gen(function* () {
      const channel = yield* Effect.acquireRelease(
        Effect.sync(() =>
          vscode.window.createOutputChannel(name, { log: true })
        ),
        (channel) => Effect.sync(() => channel.dispose())
      );
      return Logger.make((options) => {
        const message = Logger.formatLogFmt.log(options);

        switch (options.logLevel) {
          case "Trace":
            channel.trace(message);
            break;
          case "Debug":
            channel.debug(message);
            break;
          case "Warn":
            channel.warn(message);
            break;
          case "Error":
          case "Fatal":
            channel.error(message);
            break;
          default:
            channel.info(message);
            break;
        }
      });
    }),
  ]);
