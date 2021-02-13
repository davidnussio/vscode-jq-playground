'use strict'

import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import * as md5 from 'md5-file'
import * as stream from 'stream'
import { promisify } from 'util'
import fetch from 'node-fetch'
import { parse } from 'shell-quote'
import * as builtins from './builtins.json'

const pipeline = promisify(stream.pipeline)

import {
  WorkspaceFilesCompletionItemProvider,
  JQLangCompletionItemProvider,
} from './autocomplete'
import { Messages } from './messages'
import {
  parseJqCommandArgs,
  spawnCommand,
  bufferToString,
  spawnJqPlay,
} from './command-line'

const BINARIES = {
  darwin: {
    file:
      'https://github.com/stedolan/jq/releases/download/jq-1.6/jq-osx-amd64',
    checksum: 'c15f86ad9298ee71cf7d96a29f86e88a',
  },
  linux: {
    file: 'https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64',
    checksum: '1fffde9f3c7944f063265e9a5e67ae4f',
  },
  win32: {
    file:
      'https://github.com/stedolan/jq/releases/download/jq-1.6/jq-win64.exe',
    checksum: 'af2b0264f264dde1fe705ca243886fb2',
  },
}

const CONFIGS = {
  FILEPATH: undefined,
  FILENAME: /^win32/.test(process.platform) ? './jq.exe' : './jq',
  MANUAL_PATH: path.join('.', 'examples', 'manual.jqpg'),
  LANGUAGES: ['jqpg', 'jq'],
  EXECUTE_JQ_COMMAND: 'extension.executeJqCommand',
  CODE_LENS_TITLE: 'jq',
  JQ_PLAYGROUND_VERSION: 'vscode-jq-playground.version',
  SHOW_EXAMPLES: 'vscode-jq-payground.showExamples',
}

const Logger = vscode.window.createOutputChannel('jq output')

export function activate(context: vscode.ExtensionContext) {
  // vscode.workspace.onDidChangeConfiguration((e) => {
  //   Logger.append()
  //   Logger.show()
  // })
  configureSubscriptions(context)
  setupEnvironment(context)
    .then(() => checkEnvironment(context))
    .catch((error) => {
      vscode.window.showErrorMessage(
        ' 🔥 Extension activation error! Check jq output console for more details',
      )
      Logger.appendLine('')
      Logger.appendLine('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥')
      Logger.appendLine('  Extension activation error!')
      Logger.appendLine(error)
      Logger.show()
    })
}

function configureSubscriptions(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.openManual', openManual),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.openTutorial', openTutorial),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.openExamples', openExamples),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.openPlay', openPlay),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.runQueryOutput', runQueryOutput),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.runQueryEditor', runQueryEditor),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand(
      CONFIGS.EXECUTE_JQ_COMMAND,
      executeJqCommand,
    ),
  )
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(CONFIGS.LANGUAGES, {
      provideCodeLenses,
    }),
  )
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      CONFIGS.LANGUAGES,
      new WorkspaceFilesCompletionItemProvider(),
    ),
  )
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      CONFIGS.LANGUAGES,
      new JQLangCompletionItemProvider(builtins),
    ),
  )
}

// tslint:disable-next-line:no-empty
export function deactivate() {}

function setupEnvironment(context: vscode.ExtensionContext): Promise<any> {
  const config = vscode.workspace.getConfiguration()

  CONFIGS.MANUAL_PATH = path.join(context.extensionPath, CONFIGS.MANUAL_PATH)

  // Use user configurated executable or auto downloaded
  const userFilePath: fs.PathLike = config.get('jqPlayground.binaryPath')
  if (fs.existsSync(userFilePath)) {
    // User configurated binary path
    CONFIGS.FILEPATH = userFilePath
    return Promise.resolve()
  } else {
    // Default path, automatically downloaded from github
    // https://github.com/stedolan/jq
    CONFIGS.FILEPATH = path.join(context.globalStoragePath, CONFIGS.FILENAME)
    return downloadBinary(context)
  }
}

// TODO: Clean this function flow
async function checkEnvironment(
  context: vscode.ExtensionContext,
): Promise<any> {
  const jqPlayground = vscode.extensions.getExtension(
    'davidnussio.vscode-jq-playground',
  )
  const currentVersion = jqPlayground.packageJSON.version
  let previousVersion = context.globalState.get<string>(
    CONFIGS.JQ_PLAYGROUND_VERSION,
  )
  if (previousVersion === currentVersion) {
    return Promise.resolve()
  }
  // Update stored version
  context.globalState.update(CONFIGS.JQ_PLAYGROUND_VERSION, currentVersion)
  // Show update message
  if (showWelcomePage(currentVersion, previousVersion)) {
    const showExamples = context.globalState.get<boolean>(CONFIGS.SHOW_EXAMPLES)
    context.globalState.update(CONFIGS.SHOW_EXAMPLES, false)
    if (showExamples) {
      openExamples()
    }
    Messages.showWhatsNewMessage(context, currentVersion)
  }
  return Promise.resolve()
}

function openManual() {
  vscode.commands.executeCommand(
    'vscode.open',
    vscode.Uri.parse('https://stedolan.github.io/jq/manual/'),
  )
}

function openTutorial() {
  vscode.commands.executeCommand(
    'vscode.open',
    vscode.Uri.parse('https://stedolan.github.io/jq/tutorial/'),
  )
}

function openExamples() {
  fs.readFile(CONFIGS.MANUAL_PATH, {}, (err, data) => {
    vscode.workspace
      .openTextDocument({ content: data.toString(), language: 'jqpg' })
      .then((doc) =>
        vscode.window.showTextDocument(doc, vscode.ViewColumn.Active),
      )
  })
}

function openPlay() {
  vscode.window
    .showInputBox({ prompt: 'jq query', value: '.' })
    .then((query) => {
      spawnJqPlay(
        vscode,
        [query],
        vscode.window.activeTextEditor.document.getText(),
      ).fork()
    })
}

function runQueryOutput() {
  doRunQuery('output')
}

function runQueryEditor() {
  doRunQuery('editor')
}

function doRunQuery(openResult) {
  const editor = vscode.window.activeTextEditor

  let line = editor.selection.start.line
  let queryLine = ''

  do {
    queryLine = editor.document.lineAt(line).text
  } while (queryLine.startsWith('jq') === false && line-- > 0)

  const range = new vscode.Range(
    new vscode.Position(line, 0),
    new vscode.Position(line, editor.document.lineAt(line).text.length),
  )

  const match: IJqMatch = {
    document: vscode.window.activeTextEditor.document,
    range,
    openResult,
  }

  if (queryLine.startsWith('jq')) {
    executeJqCommand(match)
  } else {
    vscode.window.showWarningMessage(
      'Current line does not contain jq query string',
    )
  }
}

function md5sum(filename) {
  return fs.existsSync(filename) ? md5.sync(filename) : ''
}

function downloadBinary(context): Promise<any> {
  const { globalStoragePath } = context

  return new Promise((resolve, reject) => {
    if (!BINARIES[process.platform]) {
      return reject(`Platform (${process.platform}) not supported!`)
    }

    if (md5sum(CONFIGS.FILEPATH) === BINARIES[process.platform].checksum) {
      resolve(true)
    } else {
      Logger.appendLine(`Download jq binary for platform (${process.platform})`)
      Logger.appendLine(`  - form url ${BINARIES[process.platform].file}`)
      Logger.appendLine(`  - to dir ${globalStoragePath}`)
      if (fs.existsSync(globalStoragePath) === false) {
        fs.mkdirSync(globalStoragePath)
        Logger.appendLine(`  - dir does not exists: created`)
      }
      Logger.appendLine('  - start downloading...')
      fetch(BINARIES[process.platform].file)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Unexpected response ${res.statusText}`)
          }

          return pipeline(res.body, fs.createWriteStream(CONFIGS.FILEPATH))
        })
        .then(() => {
          Logger.appendLine('')
          if (
            md5sum(CONFIGS.FILEPATH) !== BINARIES[process.platform].checksum
          ) {
            throw new Error('Download file checksum error')
          }
          if (!/^win32/.test(process.platform)) {
            fs.chmodSync(CONFIGS.FILEPATH, '0755')
          }
          Logger.appendLine('  - [ OK ]')
          Logger.show()
          resolve(true)
        })
        .catch((err) => {
          Logger.appendLine('')
          Logger.appendLine('  - [ ERROR ]')
          Logger.appendLine(`  - ${err}`)
          Logger.show()
          reject(
            ' *** An error occurred during activation.\n *** Try again or download jq binary manually.\n *** Check vscode configuration → Jq Playground: Binary Path',
          )
        })
    }
  })
}

function provideCodeLenses(document: vscode.TextDocument) {
  const matches: IJqMatch[] = findRegexes(document)
  return matches
    .map((match) => {
      return [
        new vscode.CodeLens(match.range, {
          title: '⚡ console (ctrl+enter)',
          command: CONFIGS.EXECUTE_JQ_COMMAND,
          arguments: [match],
        }),
        new vscode.CodeLens(match.range, {
          title: '⚡ editor (shift+enter)',
          command: CONFIGS.EXECUTE_JQ_COMMAND,
          arguments: [{ ...match, openResult: 'editor' }],
        }),
        // TODO: Disabled
        // new vscode.CodeLens(match.range, {
        //   title: '🔗 jqplay',
        //   command: CONFIGS.EXECUTE_JQ_COMMAND,
        //   arguments: [{ ...match, openResult: 'jqplay' }],
        // }),
      ]
    })
    .reduce((a, b) => a.concat(b))
}

interface IJqMatch {
  document: vscode.TextDocument
  range: vscode.Range
  openResult: string
}

function findRegexes(document: vscode.TextDocument): IJqMatch[] {
  const matches: IJqMatch[] = []
  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i)
    const regex = /^(jq)\s+(.+?)/g
    regex.lastIndex = 0
    const text = line.text.substr(0, 1000)
    while (regex.exec(text)) {
      const result = jqMatch(document, i)
      if (result) {
        matches.push(result)
      }
    }
  }
  return matches
}

function jqMatch(document: vscode.TextDocument, line: number) {
  return {
    document,
    openResult: 'output',
    range: new vscode.Range(line, 0, line, 30),
  }
}

const renderOutput = (type) => (data) => {
  if (type === 'jqplay') {
    // Do nothing
  } else if (type === 'editor') {
    vscode.workspace
      .openTextDocument({ content: bufferToString(data), language: 'json' })
      .then((doc) => vscode.window.showTextDocument(doc, vscode.ViewColumn.Two))
  } else {
    Logger.clear()
    Logger.append(bufferToString(data))
    Logger.show(true)
  }
}

function renderError(data) {
  Logger.clear()
  Logger.append(bufferToString(data))
  Logger.show(true)
  vscode.window.showErrorMessage(bufferToString(data))
}

function executeJqCommand(params) {
  const document: vscode.TextDocument = params.document
  const cwd = path.join(vscode.window.activeTextEditor.document.fileName, '..')

  let queryLine: string = document
    .lineAt(params.range.start.line)
    .text.replace(/jq\s+/, '')

  const args = parseJqCommandArgs(queryLine)

  let queryLineWithoutOpts = args[args.length - 1]

  let lineOffset = 1

  if (queryLineWithoutOpts.startsWith("'")) {
    for (
      let line = params.range.start.line + lineOffset, documentLine = '';
      queryLineWithoutOpts.search(/[^\\]'\s*$/) === -1 &&
      line < document.lineCount;
      line++
    ) {
      documentLine = document.lineAt(line).text
      // Is next jq filter?
      queryLineWithoutOpts = queryLineWithoutOpts + documentLine
      lineOffset++
    }
    args[args.length - 1] = queryLineWithoutOpts.slice(1, -1)
  }
  const context: string = document.lineAt(params.range.start.line + lineOffset)
    .text
  lineOffset++

  if (isWorkspaceFile(queryLineWithoutOpts, vscode.workspace.textDocuments)) {
    args[args.length - 1] = getWorkspaceFile(
      queryLineWithoutOpts,
      vscode.workspace.textDocuments,
    )
  }

  let jqCommand
  if (params.openResult === 'jqplay') {
    jqCommand = spawnJqPlay(vscode, args).map(bufferToString)
  } else {
    jqCommand = spawnCommand(CONFIGS.FILEPATH, args, { cwd })
  }

  if (isUrl(context)) {
    fetch(context)
      .then((data) => data.text())
      .then((data) =>
        jqCommand(data).fork(renderError, renderOutput(params.openResult)),
      )
      .catch((err) => {
        Logger.append(err)
        Logger.show()
      })
  } else if (isWorkspaceFile(context, vscode.workspace.textDocuments)) {
    const text: string = getWorkspaceFile(
      context,
      vscode.workspace.textDocuments,
    )
    jqCommand(text).fork(renderError, renderOutput(params.openResult))
  } else if (isFilepath(cwd, context)) {
    const fileName: string = getFileName(cwd, context)
    if (fs.existsSync(fileName)) {
      jqCommand(fs.readFileSync(fileName).toString()).fork(
        renderError,
        renderOutput(params.openResult),
      )
    }
  } else if (
    context.match(/^\$ (http|curl|wget|cat|echo|ls|dir|grep|tail|head|find) /)
  ) {
    const [httpCli, ...httpCliOptions] = parse(context.replace('$ ', ''))
    // @TODO: check this out
    if (httpCli === 'http') {
      httpCliOptions.unshift('--ignore-stdin')
    }
    spawnCommand(httpCli, httpCliOptions, { cwd }, '')
      .chain(jqCommand)
      .fork(renderError, renderOutput(params.openResult))
  } else {
    const contextLines = [context]
    let line = params.range.start.line + lineOffset
    while (line < document.lineCount) {
      const lineText = document.lineAt(line++).text
      if (lineText.search(/^(jq)\s+(.+?)|#/) === 0) {
        break
      }
      contextLines.push(lineText + '\n')
    }
    jqCommand(contextLines.join(' ')).fork(
      renderError,
      renderOutput(params.openResult),
    )
  }
}

function isWorkspaceFile(
  context: string,
  textDocuments: ReadonlyArray<vscode.TextDocument>,
): boolean {
  return (
    textDocuments.filter(
      (document) =>
        document.fileName === context ||
        path.basename(document.fileName) === context,
    ).length === 1
  )
}

function getWorkspaceFile(
  context: string,
  textDocuments: ReadonlyArray<vscode.TextDocument>,
): string {
  for (const document of textDocuments) {
    if (
      document.fileName === context ||
      path.basename(document.fileName) === context
    ) {
      return document.getText()
    }
  }
  return ''
}

function isUrl(context: string): boolean {
  return context.search(/^http(s)?:\/\//) !== -1
}

function isFilepath(cwd: string, context: string): boolean {
  const resolvedPath = getFileName(cwd, context)
  return fs.existsSync(resolvedPath)
}

function getFileName(cwd: string, context: string): string {
  if (context.search(/^(\/|[a-z]:\\)/gi) === 0) {
    // Resolve absolute unix and window path
    return path.resolve(context)
  } else {
    // Resolve relative path
    return path.resolve(path.join(cwd, context))
  }
}

function showWelcomePage(
  version: string,
  previousVersion: string | undefined,
): boolean {
  // Fresh install, no previous version
  if (previousVersion === undefined) {
    return true
  }

  const [major, minor] = version.split('.')
  const [prevMajor, prevMinor] = previousVersion.split('.')
  if (
    // Patch updates
    (major === prevMajor && minor === prevMinor) ||
    // Don't notify on downgrades
    major < prevMajor ||
    (major === prevMajor && minor < prevMinor)
  ) {
    return false
  }

  return true
}
