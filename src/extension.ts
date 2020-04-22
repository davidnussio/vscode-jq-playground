'use strict'

import * as vscode from 'vscode'
import * as download from 'download'
import * as fs from 'fs'
import * as path from 'path'
import * as checksum from 'checksum'

// import { EditorDataHandler, OutputDataHandler } from './dataHandler'
import {
  WorkspaceFilesCompletionItemProvider,
  TestCompletionItemProvider,
} from './autocomplete'
import { Messages } from './messages'
import { parseCommandArgs, spawnCommand, bufferToString } from './command-line'

const BINARIES = {
  darwin: {
    file:
      'https://github.com/stedolan/jq/releases/download/jq-1.6/jq-osx-amd64',
    checksum: '8673400d1886ed051b40fe8dee09d89237936502',
  },
  linux: {
    file: 'https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64',
    checksum: '056ba5d6bbc617c29d37158ce11fd5a443093949',
  },
  win32: {
    file:
      'https://github.com/stedolan/jq/releases/download/jq-1.6/jq-win64.exe',
    checksum: '2b7ae7b902aa251b55f2fd73ad5b067d2215ce78',
  },
}

const CONFIGS = {
  FILEPATH: undefined,
  FILENAME: /^win32/.test(process.platform) ? './jq.exe' : './jq',
  MANUAL_PATH: path.join(__dirname, '..', 'examples', 'manual.jq'),
  LANGUAGES: ['jq'],
  EXECUTE_JQ_COMMAND: 'extension.executeJqCommand',
  CODE_LENS_TITLE: 'jq',
  JQ_PLAYGROUND_VERSION: 'vscode-jq-playground.version',
}

const Logger = vscode.window.createOutputChannel('jq output')

export function activate(context: vscode.ExtensionContext) {
  const jqPlayground = vscode.extensions.getExtension(
    'davidnussio.vscode-jq-playground',
  )!
  const currentVersion = jqPlayground.packageJSON.version
  const previousVersion = context.globalState.get<string>(
    CONFIGS.JQ_PLAYGROUND_VERSION,
  )

  void showWelcomePage(currentVersion, previousVersion)
  context.globalState.update(CONFIGS.JQ_PLAYGROUND_VERSION, currentVersion)

  CONFIGS.FILEPATH = path.join(context.globalStoragePath, CONFIGS.FILENAME)

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

  setupEnvironment(context)
    .then(() => {
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
          new TestCompletionItemProvider(),
        ),
      )
    })
    .catch((error) => {
      Logger.appendLine(error)
    })
}

// tslint:disable-next-line:no-empty
export function deactivate() {}

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
      .openTextDocument({ content: data.toString(), language: 'jq' })
      .then((doc) =>
        vscode.window.showTextDocument(doc, vscode.ViewColumn.Active),
      )
  })
}

function openPlay() {
  vscode.window
    .showInputBox({ prompt: 'jq query', value: '.' })
    .then((query) => {
      const json = encodeURIComponent(
        vscode.window.activeTextEditor.document
          .getText()
          .replace(/\n|\s{2,}$/g, '%0A'),
      )
      vscode.commands.executeCommand(
        'vscode.open',
        vscode.Uri.parse(
          `https://jqplay.org/jq?j=${json}&q=${encodeURIComponent(query)}`,
        ),
      )
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

  if (editor.selection.isEmpty) {
    const position: vscode.Position = editor.selection.active
    const queryLine = new vscode.Range(
      new vscode.Position(position.line, 0),
      new vscode.Position(position.line, position.character),
    )

    const match: IJqMatch = {
      document: vscode.window.activeTextEditor.document,
      range: queryLine,
      openResult,
    }

    if (editor.document.lineAt(position).text.startsWith('jq')) {
      executeJqCommand(match)
    } else {
      vscode.window.showWarningMessage(
        'Current line does not contain jq query string',
      )
    }
  }
}

function setupEnvironment(context: vscode.ExtensionContext): Promise<any> {
  return downloadBinary(context).then(() => upgradeMessage(context))
}

function upgradeMessage(context: vscode.ExtensionContext): Promise<any> {
  const prevVersion = context.globalState.get('jq-payload-version')
  const jqExtension = vscode.extensions.getExtension(
    'davidnussio.vscode-jq-playground',
  )
  if (prevVersion !== jqExtension.packageJSON.version) {
    context.globalState.update(
      'jq-payload-version',
      jqExtension.packageJSON.version,
    )
    openExamples()
  }
  return Promise.resolve()
}

function downloadBinary(context): Promise<any> {
  const { globalStoragePath } = context

  if (!fs.existsSync(globalStoragePath)) {
    fs.mkdirSync(globalStoragePath)
  }

  return new Promise((resolve, reject) => {
    if (!BINARIES[process.platform]) {
      return reject(`Platform (${process.platform}) not supported!`)
    }
    checksum.file(CONFIGS.FILEPATH, (error, hex) => {
      Logger.append(
        `${CONFIGS.FILEPATH} - hey ${hex} → ${
          BINARIES[process.platform].checksum
        }`,
      )
      if (hex === BINARIES[process.platform].checksum) {
        resolve()
      } else {
        Logger.append(
          `Download jq binary for platform (${process.platform})...`,
        )
        return download(BINARIES[process.platform].file).then((data) => {
          fs.writeFileSync(CONFIGS.FILEPATH, data)
          if (!/^win32/.test(process.platform)) {
            fs.chmodSync(CONFIGS.FILEPATH, '0777')
          }
          Logger.append(' [ OK ]')
          Logger.show()
          resolve()
        })
      }
    })
  })
}

function provideCodeLenses(
  document: vscode.TextDocument,
  token: vscode.CancellationToken,
) {
  const matches: IJqMatch[] = findRegexes(document)
  console.log('token → ', token)
  return matches
    .map((match) => {
      return [
        new vscode.CodeLens(match.range, {
          title: '⚡ ➜ output',
          command: CONFIGS.EXECUTE_JQ_COMMAND,
          arguments: [match],
        }),
        new vscode.CodeLens(match.range, {
          title: '⚡ ➜ editor',
          command: CONFIGS.EXECUTE_JQ_COMMAND,
          arguments: [{ ...match, openResult: 'editor' }],
        }),
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
    // eslint-disable-next-line no-unused-vars
    let match: RegExpExecArray | null
    const regex = /^(jq)\s+(.+?)/g
    regex.lastIndex = 0
    const text = line.text.substr(0, 1000)
    // tslint:disable-next-line:no-conditional-assignment
    while ((match = regex.exec(text))) {
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

// function extractArgsString(queryLine: string) {
//   const args = queryLine.match(/^(([-{1,2}][a-zA-Z0-9-]+)\s+)+/g)
//   if (args === null) {
//     return ''
//   }

//   return args[0]
// }

// const edata = new EditorDataHandler()
// const odata = new OutputDataHandler(Logger)

const renderOutput = (type) => (data) => {
  console.log('Ok...', bufferToString(data))
  if (type === 'editor') {
    vscode.workspace
      .openTextDocument({ content: bufferToString(data), language: 'jq' })
      .then((doc) => vscode.window.showTextDocument(doc, vscode.ViewColumn.Two))
  }
  Logger.clear()
  Logger.append(bufferToString(data))
  Logger.show()
}

function renderError(data) {
  console.log('Error...', bufferToString(data))
}

function executeJqCommand(params) {
  const jqCommand = spawnCommand(CONFIGS.FILEPATH)

  const document: vscode.TextDocument = params.document

  let queryLine: string = document
    .lineAt(params.range.start.line)
    .text.replace(/jq\s+/, '')

  let lineOffset = 1

  for (
    let line = params.range.start.line + lineOffset;
    queryLine.search(/\s*\\\s*$/) !== -1 && line < document.lineCount;
    line++
  ) {
    queryLine =
      queryLine.replace(/\s*\\\s*$/, ' ') +
      document.lineAt(params.range.start.line + line).text
    lineOffset++
  }
  const context: string = document.lineAt(params.range.start.line + lineOffset)
    .text
  lineOffset++

  const args = parseCommandArgs(queryLine)
  const cwd = path.join(vscode.window.activeTextEditor.document.fileName, '..')

  if (isUrl(context)) {
    download(context)
      .then((data) =>
        jqCommand(args, { cwd }, data.toString()).fork(
          renderError,
          renderOutput(params.openResult),
        ),
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
    jqCommand(args, { cwd }, text).fork(
      renderError,
      renderOutput(params.openResult),
    )
  } else if (isFilepath(context)) {
    const fileName: string = getFileName(document, context)
    if (fs.existsSync(fileName)) {
      jqCommand(args, { cwd }, fs.readFileSync(fileName).toString()).fork(
        renderError,
        renderOutput(params.openResult),
      )
    }
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
    jqCommand(args, { cwd }, contextLines.join(' ')).fork(
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
    textDocuments.filter((document) => document.fileName === context).length ===
    1
  )
}

function getWorkspaceFile(
  context: string,
  textDocuments: ReadonlyArray<vscode.TextDocument>,
): string {
  for (const document of textDocuments) {
    if (document.fileName === context) {
      return document.getText()
    }
  }
  return ''
}

// function outputDataHandlerFactory(type: string) {
//   if (type === 'editor') {
//     return new EditorDataHandler()
//   }
//   return new OutputDataHandler(Logger)
// }

function isUrl(context: string): boolean {
  return context.search(/^http(s)?/) !== -1
}

function isFilepath(context: string): boolean {
  return context.search(/^(\/|\.{1,2}\/|~\/)/) !== -1
}

function getFileName(document: vscode.TextDocument, context: string): string {
  if (context.search('/') === 0) {
    return context
  } else {
    return path.join(path.dirname(document.fileName), context)
  }
}

async function showWelcomePage(
  version: string,
  previousVersion: string | undefined,
) {
  try {
    if (previousVersion === undefined) {
      Logger.append('Welcome to jq playground install')
      return
    }

    const [major, minor] = version.split('.')
    const [prevMajor, prevMinor] = previousVersion.split('.')
    if (
      (major === prevMajor && minor === prevMinor) ||
      // Don't notify on downgrades
      major < prevMajor ||
      (major === prevMajor && minor < prevMinor)
    ) {
      return
    }

    await Messages.showWhatsNewMessage(version)
  } finally {
    Logger.show()
  }
}
