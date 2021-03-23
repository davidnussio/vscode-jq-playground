import { commands, workspace } from 'vscode'

const tokenRe = /\$\{([a-z]+)(?::([^:{}]+))?\}/gi

export interface ResolutionContext {
  cwd?: string
  env?: { [key: string]: string | undefined }
}

// reference: https://code.visualstudio.com/docs/editor/variables-reference
const replaceToken = async (
  context: ResolutionContext,
  g1: string,
  ...args: any[]
): Promise<string> => {
  const g2 = (args: any[]) => (args.length > 3 ? args[0] : null)
  switch (g1) {
    case 'env':
      return await getEnv(context, g2(args))
    case 'config':
      return await getConfig(g2(args))
    case 'command':
      return await getCommand(g2(args))
    case 'input':
      return await getInput(g2(args))
    case 'workspaceFolder':
      return await getWorkspaceFolder(g2(args))
    case 'cwd':
      return await getCwd(context)

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
      return null
  }
}

export interface ResolveVariablesFn {
  (context: ResolutionContext, input: string): Promise<string>
  (context: ResolutionContext, inputs: string[]): Promise<string[]>
}
export const resolveVariables: ResolveVariablesFn = (
  context: ResolutionContext,
  inputOrInputs: string | string[],
): Promise<any> => {
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
  if (!str) return ''
  const promises = []
  str.replace(tokenRe, (_: string, g1: string, ...args: any[]) => {
    promises.push(replaceToken(context, g1, ...args))
    return ''
  })
  if (!promises.length) return str
  const results = await Promise.all(promises)
  return str.replace(tokenRe, (match: string) => {
    const result = results.shift()
    return result != null ? result : match
  })
}

async function getEnv({ env }: ResolutionContext, name: string) {
  if (!name) return null
  return (env || process.env)[name] || ''
}

async function getConfig(name: string) {
  const config = workspace.getConfiguration()
  return name ? config.get(name, '') : null
}

async function getCommand(commandId: string) {
  const result = commandId ? await commands.executeCommand(commandId) : null
  return result?.toString() || ''
}

function getInput(inputId: string) {
  // TODO: implement me
  return null
}

async function getWorkspaceFolder(root: string) {
  const ws =
    root && workspace.workspaceFolders.length > 1
      ? workspace.workspaceFolders.find(
          (f) =>
            f.name.localeCompare(root, undefined, { sensitivity: 'base' }) ===
            0,
        )
      : workspace.workspaceFolders[0]
  return ws ? ws.uri.fsPath : null
}

async function getCwd({ cwd }: ResolutionContext) {
  return cwd || process.cwd()
}
