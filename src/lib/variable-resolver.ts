import * as Effect from "effect/Effect";
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";
import * as vscode from "vscode";

export interface VariableResolver {
  readonly resolve: (input: string) => Effect.Effect<string, Error>;
  readonly resolveMany: (
    inputs: readonly string[]
  ) => Effect.Effect<readonly string[], Error>;
}

export const VariableResolver = Context.Tag<VariableResolver>();

const variableResolverEffect = Effect.gen(function* () {
  const tokenRe = /\$\{([a-zA-Z]+)(?::([^:{}]+))?\}/gi;

  const getWorkspaceFolder = (root?: string) =>
    Effect.try(() => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return "";
      }
      const ws =
        root && workspaceFolders.length > 1
          ? workspaceFolders.find(
              (f) =>
                f.name.localeCompare(root, undefined, {
                  sensitivity: "base",
                }) === 0
            )
          : workspaceFolders[0];
      return ws ? ws.uri.fsPath : "";
    });

  const replaceToken = (g1: string, g2?: string) => {
    switch (g1) {
      case "env":
        return Effect.succeed(g2 ? process.env[g2] || "" : "");
      case "config":
        return Effect.try(() => {
          if (!g2) return "";
          const config = vscode.workspace.getConfiguration();
          return config.get(g2, "");
        });
      case "command":
        return Effect.tryPromise(() =>
          g2
            ? vscode.commands.executeCommand(g2).then((res) => res?.toString() ?? "")
            : Promise.resolve("")
        );
      case "workspaceFolder":
        return getWorkspaceFolder(g2);
      case "cwd":
        return Effect.succeed(process.cwd());
      default:
        return Effect.succeed(`\${${g1}${g2 ? ":" + g2 : ""}}`);
    }
  };

  const resolve = (input: string): Effect.Effect<string, Error> =>
    Effect.gen(function* () {
      const matches = Array.from(input.matchAll(tokenRe));
      if (matches.length === 0) {
        return input;
      }

      const replacements = yield* Effect.all(
        matches.map((match) => replaceToken(match[1], match[2]))
      );

      let i = 0;
      return input.replace(tokenRe, () => replacements[i++] || "");
    });

  const resolveMany = (inputs: readonly string[]) => Effect.all(inputs.map(resolve));

  return { resolve, resolveMany };
});

export const VariableResolverLive = Layer.effect(
  VariableResolver,
  variableResolverEffect
);
