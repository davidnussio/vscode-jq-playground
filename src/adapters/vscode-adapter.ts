import { pipe } from "effect";
import type * as Cause from "effect/Cause";
import * as Context from "effect/Context";
import type * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as LogLevel from "effect/LogLevel";
import * as Option from "effect/Option";
import * as Runtime from "effect/Runtime";
import * as Scope from "effect/Scope";
import * as Stream from "effect/Stream";
import * as SubscriptionRef from "effect/SubscriptionRef";
import * as vscode from "vscode";

export class VsCodeContext extends Context.Tag("vscode/ExtensionContext")<
  VsCodeContext,
  vscode.ExtensionContext
>() {}

export const thenable = <A>(f: () => Thenable<A>) =>
  Effect.async<A>((resume) => {
    f().then(
      (_) => resume(Effect.succeed(_)),
      (err) => resume(Effect.die(err))
    );
  });

export const thenableCatch = <A, E>(
  f: () => Thenable<A>,
  error: (error: unknown) => E
) =>
  Effect.async<A, E>((resume) => {
    f().then(
      (_) => resume(Effect.succeed(_)),
      (_) => resume(Effect.fail(error(_)))
    );
  });

export const dismissable = <A>(
  f: () => Thenable<A | undefined>
): Effect.Effect<A, Cause.NoSuchElementException> =>
  thenable(f).pipe(Effect.flatMap(Effect.fromNullable));

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
  f: (...args: Array<any>) => Effect.Effect<A, E, R>
) =>
  Effect.gen(function* () {
    const context = yield* VsCodeContext;
    const runtime = yield* Effect.runtime<R>();
    const run = Runtime.runFork(runtime);

    context.subscriptions.push(
      vscode.commands.registerCommand(command, (...args) =>
        f(...args).pipe(
          Effect.catchAllCause(Effect.log),
          Effect.annotateLogs({ command }),
          run
        )
      )
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

export const activeTextEditor = () =>
  Option.fromNullable(vscode.window.activeTextEditor);

export const openTextDocument = (options: {
  content?: string;
  language?: string;
}) => thenable(() => vscode.workspace.openTextDocument(options));

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
        : Option.fromNullable(value);
    };

    const update = (value: A) =>
      thenable(() =>
        vscode.workspace
          .getConfiguration(namespace)
          .update(setting, value, true)
      ).pipe(
        Effect.zipRight(SubscriptionRef.set(ref, Option.fromNullable(value)))
      );

    const ref = yield* SubscriptionRef.make<Option.Option<A>>(get());

    yield* listenFork(vscode.workspace.onDidChangeConfiguration, (event) =>
      event.affectsConfiguration(`${namespace}.${setting}`)
        ? pipe(
            Effect.log("Configuration changed", namespace, setting, get()),
            Effect.zipRight(SubscriptionRef.set(ref, get()))
          )
        : Effect.void
    );
    return {
      get: SubscriptionRef.get(ref),
      changes: Stream.changes(ref.changes),
      update,
    };
  });

export const configWithDefault = <A>(
  namespace: string,
  setting: string,
  defaultValue: A
) =>
  Effect.gen(function* () {
    const get = () =>
      vscode.workspace.getConfiguration(namespace).get<A>(setting);
    const update = (value: A) =>
      thenable(() =>
        vscode.workspace
          .getConfiguration(namespace)
          .update(setting, value, true)
      );
    const ref = yield* SubscriptionRef.make(get() ?? defaultValue);
    yield* listenFork(vscode.workspace.onDidChangeConfiguration, (event) =>
      event.affectsConfiguration(`${namespace}.${setting}`)
        ? pipe(
            Effect.log("Configuration changed", namespace, setting, get()),
            Effect.zipRight(SubscriptionRef.set(ref, get() ?? defaultValue))
          )
        : Effect.void
    );
    return {
      get: SubscriptionRef.get(ref),
      changes: Stream.changes(ref.changes),
      update,
    };
  });

export const listen = <A, R>(
  event: vscode.Event<A>,
  f: (data: A) => Effect.Effect<void, never, R>
): Effect.Effect<never, never, R> =>
  Effect.flatMap(Effect.runtime<R>(), (runtime) =>
    Effect.async<never>((_resume) => {
      const run = Runtime.runFork(runtime);
      const d = event((data) =>
        run(
          Effect.catchAllCause(f(data), (_) =>
            Effect.log("unhandled defect in event listener", _)
          )
        )
      );
      return Effect.sync(() => {
        d.dispose();
      });
    })
  );

export const listenStream = <A>(event: vscode.Event<A>): Stream.Stream<A> =>
  Stream.async<A>((emit) => {
    const d = event((data) => emit.single(data));
    return Effect.sync(() => {
      d.dispose();
    });
  });

export const listenFork = <A, R>(
  event: vscode.Event<A>,
  f: (data: A) => Effect.Effect<void, never, R>
) => Effect.forkScoped(listen(event, f));

export interface Emitter<A> {
  readonly event: vscode.Event<A>;
  readonly fire: (data: A) => Effect.Effect<void>;
}

export const emitter = <A>() =>
  Effect.gen(function* () {
    const emitter = new vscode.EventEmitter<A>();
    yield* Effect.addFinalizer(() => Effect.sync(() => emitter.dispose()));
    const fire = (data: A) => Effect.sync(() => emitter.fire(data));
    return {
      event: emitter.event,
      fire,
    } as Emitter<A>;
  });

export const emitterOptional = <A>() =>
  Effect.map(emitter<A | null | undefined>(), (emitter) => ({
    ...emitter,
    fire: (data: Option.Option<A>) => emitter.fire(Option.getOrUndefined(data)),
  }));

export interface TreeDataProvider<A> {
  readonly children: (
    element: Option.Option<A>
  ) => Effect.Effect<Option.Option<Array<A>>>;
  readonly parent?: (element: A) => Effect.Effect<Option.Option<A>>;
  readonly resolve?: (
    item: vscode.TreeItem,
    element: A
  ) => Effect.Effect<Option.Option<vscode.TreeItem>>;
  readonly treeItem: (element: A) => Effect.Effect<vscode.TreeItem>;
}

export const TreeDataProvider = <A>(_: TreeDataProvider<A>) => _;

export const treeDataProvider =
  <A>(name: string) =>
  <R, E>(
    create: (
      refresh: (data: Option.Option<A | Array<A>>) => Effect.Effect<void>
    ) => Effect.Effect<TreeDataProvider<A>, E, R>
  ): Layer.Layer<never, E, Exclude<R, Scope.Scope> | VsCodeContext> =>
    Effect.gen(function* () {
      const onChange = yield* emitterOptional<A | Array<A>>();
      const provider = yield* create(onChange.fire);
      const vscodeProvider: vscode.TreeDataProvider<A> = {
        onDidChangeTreeData: onChange.event,
        getTreeItem(element) {
          return Effect.runPromise(provider.treeItem(element));
        },
        getChildren(element) {
          return Effect.runPromise(
            Effect.map(
              provider.children(Option.fromNullable(element)),
              Option.getOrUndefined
            )
          );
        },
        ...(provider.parent
          ? {
              getParent: (element: A) =>
                Effect.runPromise(
                  // biome-ignore lint/style/noNonNullAssertion: parent is checked before this branch
                  Effect.map(provider.parent!(element), Option.getOrUndefined)
                ),
            }
          : {}),
        ...(provider.resolve
          ? {
              resolveTreeItem: (
                item: vscode.TreeItem,
                element: A,
                token: vscode.CancellationToken
              ) =>
                runWithTokenDefault(
                  Effect.map(
                    // biome-ignore lint/style/noNonNullAssertion: resolve is checked before this branch
                    provider.resolve!(item, element),
                    Option.getOrUndefined
                  ),
                  token
                ),
            }
          : {}),
      };
      const context = yield* VsCodeContext;
      context.subscriptions.push(
        vscode.window.createTreeView(name, {
          treeDataProvider: vscodeProvider,
          showCollapseAll: true,
        })
      );
    }).pipe(Layer.scopedDiscard);

/**
 * Wraps an Effect in a VS Code progress notification with cancellation support.
 * The notification only appears after `delay` (default 5s) to avoid flashing
 * on fast operations. When the user clicks Cancel, the fiber is interrupted,
 * which propagates to all child processes via AbortSignal in Effect.async.
 */
export const withProgress = <A, E, R>(
  title: string,
  effect: Effect.Effect<A, E, R>,
  delay: Duration.DurationInput = "2 seconds"
): Effect.Effect<A, E, R> =>
  Effect.gen(function* () {
    const fiber = yield* Effect.fork(effect);

    // Wait for the fiber to complete within the delay
    const fast = yield* Fiber.join(fiber).pipe(
      Effect.timeout(delay),
      Effect.option
    );

    if (Option.isSome(fast)) {
      return fast.value;
    }

    // Still running — show progress and wait for completion
    return yield* Effect.async<A, E>((resume) => {
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

            Effect.runCallback(Fiber.join(fiber) as Effect.Effect<A, E>, {
              onExit: (exit) => {
                tokenDispose.dispose();
                resolvePromise();
                if (exit._tag === "Success") {
                  resume(Effect.succeed(exit.value));
                } else {
                  resume(Effect.failCause(exit.cause) as Effect.Effect<A, E>);
                }
              },
            });
          })
      );
    });
  });

export const runWithToken = <R>(runtime: Runtime.Runtime<R>) => {
  const runCallback = Runtime.runCallback(runtime);
  return <E, A>(
    effect: Effect.Effect<A, E, R>,
    token: vscode.CancellationToken
  ) =>
    new Promise<A | undefined>((resolve) => {
      const cancel = runCallback(effect, {
        onExit: (exit) => {
          tokenDispose.dispose();

          if (exit._tag === "Success") {
            resolve(exit.value);
          } else {
            resolve(undefined);
          }
        },
      });
      const tokenDispose = token.onCancellationRequested(() => {
        cancel();
      });
    });
};
export const runWithTokenDefault = runWithToken(Runtime.defaultRuntime);

export const launch = <E>(layer: Layer.Layer<never, E, VsCodeContext>) =>
  Effect.gen(function* () {
    const context = yield* VsCodeContext;
    const scope = yield* Scope.make();
    context.subscriptions.push({
      dispose: () => Effect.runFork(Scope.close(scope, Exit.void)),
    });
    yield* Layer.buildWithScope(layer, scope);
  }).pipe(Effect.catchAllCause(Effect.logFatal));

export const logger = (name: string) =>
  Logger.replaceScoped(
    Logger.defaultLogger,
    Effect.gen(function* () {
      const channel = yield* Effect.acquireRelease(
        Effect.sync(() =>
          vscode.window.createOutputChannel(name, { log: true })
        ),
        (channel) => Effect.sync(() => channel.dispose())
      );
      return Logger.make((options) => {
        const message = Logger.logfmtLogger.log(options);

        switch (options.logLevel) {
          case LogLevel.Trace:
            channel.trace(message);
            break;
          case LogLevel.Debug:
            channel.debug(message);
            break;
          case LogLevel.Warning:
            channel.warn(message);
            break;
          case LogLevel.Error:
          case LogLevel.Fatal:
            channel.error(message);
            break;
          default:
            channel.info(message);
            break;
        }
      });
    })
  );

export class VsCodeDebugSession extends Context.Tag("vscode/DebugSession")<
  VsCodeDebugSession,
  vscode.DebugSession
>() {}

export const debugRequest = <A = unknown>(
  command: string,
  // biome-ignore lint/suspicious/noExplicitAny: vscode debug request args are untyped
  args?: any
): Effect.Effect<A, never, VsCodeDebugSession> =>
  Effect.flatMap(VsCodeDebugSession, (session) =>
    thenable(() => session.customRequest(command, args))
  );
