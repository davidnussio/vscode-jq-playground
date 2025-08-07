import * as fs from "fs";
import * as md5 from "md5-file";
import * as path from "path";
import { parse } from "shell-quote";
import * as stream from "stream";
import { promisify } from "util";
import * as vscode from "vscode";
import {
  jqLangCompletionItemProvider,
  workspaceFilesCompletionItemProvider,
  // jqOptionsCompletionItemProvider,
} from "../autocomplete";
import * as builtins from "../builtins";
import { parseJqCommandArgs, spawnCommand } from "./command-line";
import { BINARIES, CONFIGS } from "../configs";
import inputBoxFilter from "../inputbox-filter";
import { buildJqCommandArgs, type JqOptions } from "../jq-options";
import { Debug, Logger } from "../logger";
import showWhatsNewMessage from "../messages";
import { type RenderOutputType, renderError, renderOutput } from "../renderers";
import { resolveVariables } from "../to-migrate/variable-resolver";
import { currentWorkingDirectory } from "./vscode-window";

interface IJqMatch {
  document: vscode.TextDocument;
  range: vscode.Range;
  openResult: string;
}

const pipeline = promisify(stream.pipeline);

const inputBoxFilterHandler = inputBoxFilter();

function doRunQuery(openResult: RenderOutputType) {
  const editor = vscode.window.activeTextEditor;

  const variables = {};
  for (let i = 0; i < editor.document.lineCount; i++) {
    const lineText = editor.document.lineAt(i).text.trim();
    if (lineText.startsWith("jq")) {
      break;
    }
    if (lineText.startsWith("#")) {
      continue;
    }
    const [varName, varValue] = lineText.split("=");
    if (varName && varValue) {
      variables[varName.trim()] = varValue.trim();
    }
  }

  let { line } = editor.selection.start;
  let queryLine = "";

  do {
    queryLine = editor.document.lineAt(line).text;
  } while (queryLine.startsWith("jq") === false && line-- > 0);

  const range = new vscode.Range(
    new vscode.Position(line, 0),
    new vscode.Position(line, editor.document.lineAt(line).text.length)
  );

  const match: IJqMatch = {
    document: vscode.window.activeTextEditor.document,
    range,
    openResult,
  };

  if (queryLine.startsWith("jq")) {
    executeJqCommand(match, variables);
  } else {
    vscode.window.showWarningMessage(
      "Current line does not contain jq query string"
    );
  }
}

function runQueryCommand(renderType: RenderOutputType) {
  return () => doRunQuery(renderType);
}

function md5sum(filename) {
  return fs.existsSync(filename) ? md5.sync(filename) : "";
}

function downloadBinary(context): Promise<boolean> {
  const { globalStoragePath } = context;
  const platformArch = BINARIES[process.platform][process.arch];

  return new Promise((resolve, reject) => {
    if (!platformArch) {
      return reject(new Error(`Platform (${platformArch}) not supported!`));
    }

    if (md5sum(CONFIGS.FILEPATH) === platformArch.checksum) {
      return resolve(true);
    }
    Logger.appendLine(`Download jq binary for platform (${platformArch})`);
    Logger.appendLine(`  🌌 form url ${platformArch.file}`);
    Logger.appendLine(`  📂 to dir ${globalStoragePath}`);
    if (fs.existsSync(globalStoragePath) === false) {
      fs.mkdirSync(globalStoragePath);
      Logger.appendLine("  ✅ dir does not exists: created");
    }
    Logger.appendLine("  💤 start downloading...");
    return fetch(platformArch.file)
      .then((res) => {
        if (!res.ok) {
          reject(new Error(`Unexpected response ${res.statusText}`));
        }

        return pipeline(res.body, fs.createWriteStream(CONFIGS.FILEPATH));
      })
      .then(() => {
        Logger.appendLine("");
        if (md5sum(CONFIGS.FILEPATH) !== platformArch.checksum) {
          reject(new Error("Download file checksum error"));
        }
        if (!/^win32/.test(process.platform)) {
          fs.chmodSync(CONFIGS.FILEPATH, "0755");
        }
        Logger.appendLine("  ✅ [ OK ]");
        Logger.show();
        resolve(true);
      })
      .catch((err) => {
        Logger.appendLine("");
        Logger.appendLine("  💥 [ ERROR ]");
        Logger.appendLine(`  💥 ${err}`);
        Logger.show();
        reject(
          new Error(
            " *** An error occurred during activation.\n *** Try again or download jq binary manually.\n *** Check vscode configuration → Jq Playground: Binary Path"
          )
        );
      });
  });
}

async function executeJqInputCommand({
  cwd = currentWorkingDirectory(),
  env,
  rawArgs,
  ...params
}: JqOptions) {
  try {
    const args: string[] = rawArgs
      ? parseJqCommandArgs(rawArgs)
      : buildJqCommandArgs(params);
    let input: string = null;
    if (params.jsonInput && typeof params.input === "string") {
      input = params.input;
    } else if (Array.isArray(params.input)) {
      args.push(...params.input);
    } else if (params.input) {
      args.push(params.input);
    }

    const context = { cwd, env };
    const resolvedArgs = await resolveVariables(context, args);
    const resolvedInput = await resolveVariables(context, input);

    const result = (
      await spawnCommand(
        CONFIGS.FILEPATH,
        resolvedArgs,
        context,
        resolvedInput
      ).toPromise()
    ).slice(0, -1); // remove trailing newline
    renderOutput(null)(result);
    return result;
  } catch (err) {
    renderError(err);
    throw err;
  }
}

function isWorkspaceFile(
  context: string,
  textDocuments: ReadonlyArray<vscode.TextDocument>
): boolean {
  return (
    textDocuments.filter(
      (document) =>
        document.fileName === context ||
        path.basename(document.fileName) === context
    ).length === 1
  );
}

function getWorkspaceFile(
  context: string,
  textDocuments: ReadonlyArray<vscode.TextDocument>
): string {
  const foundDocument = textDocuments.find(
    (document) =>
      document.fileName === context ||
      path.basename(document.fileName) === context
  );
  return foundDocument ? foundDocument.getText() : "";
}

function isUrl(context: string): boolean {
  return context.search(/^http(s)?:\/\//) !== -1;
}

function getFileName(cwd: string, context: string): string {
  if (context.search(/^(\/|[a-z]:\\)/gi) === 0) {
    // Resolve absolute unix and window path
    return path.resolve(context);
  }
  // Resolve relative path
  return path.resolve(path.join(cwd, context));
}

function isFilepath(cwd: string, context: string): boolean {
  if (!context) {
    return false;
  }
  const resolvedPath = getFileName(cwd, context);
  const fileExists = fs.existsSync(resolvedPath);

  if (fileExists) {
    return true;
  }
  const files = context.split(/\s+/);

  return files.reduce(
    (acc, cur) => acc && fs.existsSync(getFileName(cwd, cur)),
    true
  );
}

function getFiles(cwd: string, context: string): ReadonlyArray<string> {
  const resolvedPath = getFileName(cwd, context);
  const fileExists = fs.existsSync(resolvedPath);

  if (fileExists) {
    return [resolvedPath];
  }
  const files = context.split(/\s+/);

  return files.map((file) => getFileName(cwd, file));
}

function executeJqCommand(params, variables) {
  const { document } = params;
  const cwd = currentWorkingDirectory();

  const queryLine: string = document
    .lineAt(params.range.start.line)
    .text.replace(/jq\s+/, "");

  const args = parseJqCommandArgs(queryLine);

  let queryLineWithoutOpts = args[args.length - 1];

  let lineOffset = 1;

  if (queryLineWithoutOpts.startsWith("'")) {
    for (
      let line = params.range.start.line + lineOffset, documentLine = "";
      queryLineWithoutOpts.search(/[^\\]'\s*$/) === -1 &&
      line < document.lineCount;
      line++
    ) {
      documentLine = document.lineAt(line).text;
      // Is next jq filter?
      queryLineWithoutOpts += documentLine;
      lineOffset++;
    }
    args[args.length - 1] = queryLineWithoutOpts.slice(1, -1);
  }
  let contextLine = Math.min(
    params.range.start.line + lineOffset,
    document.lineCount - 1
  );
  let outputFile = "";
  if (document.lineAt(contextLine)?.text?.startsWith("> ")) {
    outputFile = document.lineAt(contextLine).text.replace("> ", "").trim();
    contextLine++;
    lineOffset++;
  }
  let appendToOutputFile = false;
  if (document.lineAt(contextLine)?.text?.startsWith(">> ")) {
    outputFile = document.lineAt(contextLine).text.replace(">> ", "").trim();
    appendToOutputFile = true;
    contextLine++;
    lineOffset++;
  }
  const context: string = document.lineAt(contextLine)?.text;
  lineOffset++;

  const renderOutputDecotator = ([debug, out]) => {
    const outFile: string | boolean = outputFile
      ? getFileName(cwd, outputFile)
      : false;

    if (debug) {
      Debug.append(debug);
      // Debug.show(true);
    }

    if (outFile) {
      if (appendToOutputFile) {
        fs.appendFileSync(outFile, out);
      } else {
        fs.writeFileSync(outFile, out);
      }
    } else {
      renderOutput(params.openResult)(out);
    }
  };

  if (isWorkspaceFile(queryLineWithoutOpts, vscode.workspace.textDocuments)) {
    args[args.length - 1] = getWorkspaceFile(
      queryLineWithoutOpts,
      vscode.workspace.textDocuments
    );
  }

  const jqCommand = spawnCommand(CONFIGS.FILEPATH, args, {
    cwd,
  });

  if (isUrl(context)) {
    fetch(context)
      .then((data) => data.text())
      .then((data) => jqCommand(data).fork(renderError, renderOutputDecotator))
      .catch((err) => {
        Logger.append(err);
        Logger.show();
      });
  } else if (isWorkspaceFile(context, vscode.workspace.textDocuments)) {
    const text: string = getWorkspaceFile(
      context,
      vscode.workspace.textDocuments
    );
    jqCommand(text).fork(renderError, renderOutputDecotator);
  } else if (isFilepath(cwd, context.trim())) {
    spawnCommand(
      CONFIGS.FILEPATH,
      args.concat(getFiles(cwd, context.trim())),
      {
        cwd,
      },
      null
    ).fork(renderError, renderOutputDecotator);
  } else if (
    context.match(
      /^\$ (http|curl|wget|cat|echo|ls|dir|grep|tail|head|find)(?:\.exe)? /
    )
  ) {
    const [httpCli, ...httpCliOptions] = parse(context.replace("$ ", ""), {
      ...process.env,
      ...variables,
    });
    // @TODO: check this out
    if (httpCli === "http") {
      httpCliOptions.unshift("--ignore-stdin");
    }
    spawnCommand(httpCli, httpCliOptions, { cwd }, null).fork(
      renderError,

      ([_, out]) => {
        jqCommand(out).fork(renderError, renderOutputDecotator);
      }
    );
  } else {
    const contextLines = [context];
    let line = params.range.start.line + lineOffset;
    while (line < document.lineCount) {
      const lineText = document.lineAt(line++).text;
      if (lineText.search(/^(jq)\s+(.+?)|#/) === 0) {
        break;
      }
      contextLines.push(`${lineText}\n`);
    }
    jqCommand(contextLines.join(" ")).fork(renderError, renderOutputDecotator);
  }
}

function showWelcomePage(
  version: string,
  previousVersion: string | undefined
): boolean {
  // Fresh install, no previous version
  if (previousVersion === undefined) {
    return true;
  }

  const [major, minor] = version.split(".");
  const [prevMajor, prevMinor] = previousVersion.split(".");
  if (
    // Patch updates
    (major === prevMajor && minor === prevMinor) ||
    // Don't notify on downgrades
    major < prevMajor ||
    (major === prevMajor && minor < prevMinor)
  ) {
    return false;
  }

  return true;
}

function configureSubscriptions(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.runQueryEditor",
      runQueryCommand("editor")
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.createJqpgFromFilter",
      inputBoxFilterHandler(true)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.jqpgFromFilter",
      inputBoxFilterHandler(false)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.executeJqInputCommand",
      executeJqInputCommand
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      CONFIGS.EXECUTE_JQ_COMMAND,
      executeJqCommand
    )
  );
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(CONFIGS.LANGUAGES, {
      provideCodeLenses,
    })
  );

  context.subscriptions.push(workspaceFilesCompletionItemProvider());
  context.subscriptions.push(jqLangCompletionItemProvider(builtins));
  // context.subscriptions.push(jqOptionsCompletionItemProvider());
}

async function checkEnvironment(
  context: vscode.ExtensionContext
): Promise<string | true> {
  const jqPlayground = vscode.extensions.getExtension(
    "davidnussio.vscode-jq-playground"
  );
  const currentVersion = jqPlayground.packageJSON.version;
  const previousVersion = context.globalState.get<string>(
    CONFIGS.JQ_PLAYGROUND_VERSION
  );
  if (previousVersion === currentVersion) {
    return true;
  }
  // Update stored version
  context.globalState.update(CONFIGS.JQ_PLAYGROUND_VERSION, currentVersion);
  // Show update message
  if (showWelcomePage(currentVersion, previousVersion)) {
    const showExamples = context.globalState.get<boolean>(
      CONFIGS.SHOW_EXAMPLES
    );
    context.globalState.update(CONFIGS.SHOW_EXAMPLES, false);
    if (showExamples) {
      // openExamples();
    }

    return showWhatsNewMessage(context, currentVersion);
  }
  return true;
}

async function setupEnvironment(
  context: vscode.ExtensionContext
): Promise<boolean> {
  const jqPath = process.env.PATH?.split(path.delimiter).find((dir) => {
    return fs.existsSync(path.join(dir, "jq"));
  });

  if (jqPath) {
    CONFIGS.FILEPATH = path.join(jqPath, "jq");
    return true;
  }

  const config = vscode.workspace.getConfiguration();

  CONFIGS.MANUAL_PATH = path.join(context.extensionPath, CONFIGS.MANUAL_PATH);

  // Use user configurated executable or auto downloaded
  const userFilePath: fs.PathLike = config.get(
    "jqPlayground.binaryPath"
  ) as string;
  if (fs.existsSync(userFilePath)) {
    // User configurated binary path
    CONFIGS.FILEPATH = userFilePath.toString();
    return true;
  }
  // Default path, automatically downloaded from github
  // https://github.com/stedolan/jq
  CONFIGS.FILEPATH = path.join(
    context.globalStorageUri.fsPath,
    CONFIGS.FILENAME
  );
  return downloadBinary(context);
}
