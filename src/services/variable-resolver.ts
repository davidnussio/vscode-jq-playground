import { Effect, Layer } from "effect";
import { commands, workspace } from "vscode";
import { thenable } from "../adapters/vscode-adapter";

const tokenRe = /\$\{([a-z]+)(?::([^:{}]+))?\}/gi;

export class VariableResolver extends Effect.Service<VariableResolver>()(
  "VariableResolver",
  {
    effect: Effect.gen(function* () {
      const getEnv = (name: string) =>
        Effect.sync(() => {
          if (!name) {
            return "";
          }
          return process.env[name] || "";
        });

      const getConfig = (name: string) =>
        Effect.sync(() => {
          const config = workspace.getConfiguration();
          return name ? config.get<string>(name, "") : "";
        });

      const getCommand = (commandId: string) =>
        Effect.gen(function* () {
          if (!commandId) {
            return "";
          }
          const result = yield* thenable(() =>
            commands.executeCommand(commandId)
          );
          return result ? String(result) : "";
        });

      const getInput = (inputId: string) =>
        Effect.succeed(""); // TODO: Implement using input box adapter if needed

      const getWorkspaceFolder = (root: string) =>
        Effect.sync(() => {
          if (
            !workspace.workspaceFolders ||
            workspace.workspaceFolders.length === 0
          ) {
            return "";
          }
          const ws =
            root && workspace.workspaceFolders.length > 1
              ? workspace.workspaceFolders.find(
                  (f) =>
                    f.name.localeCompare(root, undefined, {
                      sensitivity: "base",
                    }) === 0
                )
              : workspace.workspaceFolders[0];
          return ws ? ws.uri.fsPath : "";
        });

      const getCwd = () =>
        Effect.sync(() => {
          // Logic to get CWD from context or process
          return process.cwd();
        });

      // reference: https://code.visualstudio.com/docs/editor/variables-reference
      const g2 = (args: any[]) => (args.length > 2 ? args[0] : null);

      const replaceToken = (
        g1: string,
        ...args: any[]
      ): Effect.Effect<string> => {
        switch (g1) {
          case "env":
            return getEnv(g2(args));
          case "config":
            return getConfig(g2(args));
          case "command":
            return getCommand(g2(args));
          case "input":
            return getInput(g2(args));
          case "workspaceFolder":
            return getWorkspaceFolder(g2(args));
          case "cwd":
            return getCwd();

          case "workspaceFolderBasename":
          case "file":
          case "fileWorkspaceFolder":
          case "relativeFile":
          case "relativeFileDirname":
          case "fileBasename":
          case "fileBasenameNoExtension":
          case "fileDirname":
          case "fileExtname":
          case "lineNumber":
          case "selectedText":
          case "execPath":
          case "defaultBuildTask":
          case "pathSeparator":
          default:
            return Effect.succeed("");
        }
      };

      const resolveVariablesForInput = (str: string): Effect.Effect<string> =>
        Effect.gen(function* () {
          if (!str) {
            return "";
          }

          const matches: {
            match: string;
            g1: string;
            args: any[];
            index: number;
          }[] = [];
          str.replace(
            tokenRe,
            (match: string, g1: string, ...args: any[]) => {
              matches.push({ match, g1, args, index: matches.length });
              return "";
            }
          );

          if (matches.length === 0) {
            return str;
          }

          const replacements = yield* Effect.all(
            matches.map(({ g1, args }) => replaceToken(g1, ...args))
          );

          let i = 0;
          return str.replace(tokenRe, () => {
            const val = replacements[i];
            i++;
            return val;
          });
        });

      const resolveVariables = (
        inputOrInputs: string | string[]
      ): Effect.Effect<string | string[]> => {
        if (Array.isArray(inputOrInputs)) {
          return Effect.all(inputOrInputs.map(resolveVariablesForInput));
        }
        return resolveVariablesForInput(inputOrInputs);
      };

      return {
        resolveVariables,
      };
    }),
  }
) {}

export const VariableResolverLive = VariableResolver.Default;
