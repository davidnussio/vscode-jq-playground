import { commands, workspace } from 'vscode'

const tokenRe = /\$\{([._\-a-z0-9]+)(?::([._\-a-z0-9]+))?\}/gi

export interface ResolutionContext {
  cwd?: string
  env?: { [key: string]: string | undefined }
}

// reference: https://code.visualstudio.com/docs/editor/variables-reference
const replaceToken = async (
  context: ResolutionContext,
  match: string,
  g1: string,
  ...args: any[]
): Promise<string> => {
  const g2 = (args: any[]) => (args.length > 3 ? args[0] : null)
  switch (g1) {
    case 'env':
      return await getEnv(context, g2(args), match)
    case 'config':
      return await getConfig(g2(args), match)
    case 'command':
      return await getCommand(g2(args), match)
    case 'input':
      return await getInput(g2(args), match)
    case 'workspaceFolder':
      return await getWorkspaceFolder(g2(args), match)
    case 'cwd':
      return await getCwd(context, match)

    case 'workspaceFolderBasename':
    case 'file':
    case 'fileWorkspaceFolder':
    case 'relativeFile':
    case 'relativeFileDirname':
    case 'fileBasename':
    case 'fileBasenameNoExtension':
    case 'fileDirname':
    case 'fileExtname':
    case 'lineNumber':
    case 'selectedText':
    case 'execPath':
    case 'defaultBuildTask':
    case 'pathSeparator':
    default:
      return match
  }
}

export function resolveVariables(
  context: ResolutionContext,
  input: string,
): Promise<string>
export function resolveVariables(
  context: ResolutionContext,
  inputs: string[],
): Promise<string[]>
export function resolveVariables(
  context: ResolutionContext,
  inputOrInputs: string | string[],
): Promise<string | string[]> {
  return Array.isArray(inputOrInputs)
    ? Promise.all(
        inputOrInputs.map((i) => resolveVariablesForInputAsync(context, i)),
      )
    : resolveVariablesForInputAsync(context, inputOrInputs)
}

async function resolveVariablesForInputAsync(
  context: ResolutionContext,
  str: string,
): Promise<string> {
  if (!str) return str
  const promises = []
  str.replace(tokenRe, (match: string, g1: string, ...args: any[]) => {
    promises.push(replaceToken(context, match, g1, ...args))
    return match
  })
  const results = await Promise.all(promises)
  return str.replace(tokenRe, () => results.shift())
}

function getEnv(
  { env }: ResolutionContext,
  name: string,
  defaultValue: string,
) {
  const thisEnv = env || process.env || {}
  return name ? thisEnv[name] : defaultValue
}

function getConfig(name: string, defaultValue: string) {
  const config = workspace.getConfiguration()
  return name ? config.get(name, defaultValue) : defaultValue
}

async function getCommand(commandId: string, defaultValue: string) {
  const result = commandId ? await commands.executeCommand(commandId) : null
  return result?.toString() || defaultValue
}

async function getInput(inputId: string, defaultValue: string) {
  // TODO: implement me
  return defaultValue
}

function getWorkspaceFolder(root: string, defaultValue: string) {
  const ws =
    root && workspace.workspaceFolders.length > 1
      ? workspace.workspaceFolders.find(
          (f) =>
            f.name.localeCompare(root, undefined, { sensitivity: 'base' }) ===
            0,
        )
      : workspace.workspaceFolders[0]
  return ws ? ws.uri.fsPath : defaultValue
}

async function getCwd(context: ResolutionContext, defaultValue: string) {
  let result = context.cwd ? await resolveVariables(context, context.cwd) : null
  return result || process.cwd() || defaultValue
}
