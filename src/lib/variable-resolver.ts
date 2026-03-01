import { Effect, Option } from "effect";
import { commands, workspace } from "vscode";
import {
  executeCommand,
  thenable,
  VsCodeContext,
} from "../adapters/vscode-adapter";

const tokenRe = /\$\{([a-z]+)(?::([^:{}]+))?\}/gi;

export interface ResolutionContext {
  cwd?: string | undefined;
  env?: { [key: string]: string | undefined } | undefined;
}

export interface ResolveVariablesFn {
  (context: ResolutionContext, input: string): Effect.Effect<string>;
  (context: ResolutionContext, inputs: string[]): Effect.Effect<string[]>;
}

const getEnv = ({ env }: ResolutionContext, name: string) =>
  Effect.sync(() => {
    if (!name) {
      return null;
    }
    return (env || process.env)[name] || "";
  });

const getConfig = (name: string) =>
  Effect.sync(() => {
    const config = workspace.getConfiguration();
    return name ? config.get(name, "") : null;
  });

const getCommand = (commandId: string) =>
  Effect.gen(function* () {
    const result = commandId ? yield* executeCommand(commandId) : null;
    return result?.toString() || "";
  });

const getInput = (inputId: string) =>
  Effect.sync(() => {
    // TODO: implement me
    return "";
  });

const getWorkspaceFolder = (root: string) =>
  Effect.sync(() => {
    const ws =
      root && workspace.workspaceFolders && workspace.workspaceFolders.length > 1
        ? workspace.workspaceFolders.find(
            (f) =>
              f.name.localeCompare(root, undefined, { sensitivity: "base" }) ===
              0
          )
        : workspace.workspaceFolders
          ? workspace.workspaceFolders[0]
          : undefined;
    return ws ? ws.uri.fsPath : null;
  });

const getCwd = ({ cwd }: ResolutionContext) =>
  Effect.sync(() => {
    return cwd || process.cwd();
  });

// reference: https://code.visualstudio.com/docs/editor/variables-reference
const g2 = (args: any[]) => (args.length > 2 ? args[0] : null);

const replaceToken = (
  context: ResolutionContext,
  g1: string,
  ...args: any[]
): Effect.Effect<string | null> => {
  switch (g1) {
    case "env":
      return getEnv(context, g2(args));
    case "config":
      return getConfig(g2(args));
    case "command":
      return getCommand(g2(args));
    case "input":
      return getInput(g2(args));
    case "workspaceFolder":
      return getWorkspaceFolder(g2(args));
    case "cwd":
      return getCwd(context);

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
      return Effect.succeed(null);
  }
};

const resolveVariablesForInputAsync = (
  context: ResolutionContext,
  str: string
): Effect.Effect<string> =>
  Effect.gen(function* () {
    if (!str) {
      return "";
    }
    const promises: Effect.Effect<string | null>[] = [];
    str.replace(tokenRe, (_: string, g1: string, ...args: any[]) => {
      promises.push(replaceToken(context, g1, ...args));
      return "";
    });
    if (!promises.length) {
      return str;
    }
    const results = yield* Effect.all(promises);
    return str.replace(tokenRe, (match: string) => {
      const result = results.shift();
      return result !== null && result !== undefined ? result : match;
    });
  });

export const resolveVariables = (
  context: ResolutionContext,
  inputOrInputs: string | string[]
): Effect.Effect<any> =>
  Array.isArray(inputOrInputs)
    ? Effect.all(
        inputOrInputs.map((i) => resolveVariablesForInputAsync(context, i))
      )
    : resolveVariablesForInputAsync(context, inputOrInputs);
