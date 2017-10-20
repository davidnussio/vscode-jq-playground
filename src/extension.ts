'use strict';

import * as vscode from 'vscode';
import * as download from 'download';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

const BINARIES = {
    'linux': 'https://github.com/stedolan/jq/releases/download/jq-1.5/jq-linux64',
    'mac': 'https://github.com/stedolan/jq/releases/download/jq-1.5/jq-osx-amd64',
    'win32': 'https://github.com/stedolan/jq/releases/download/jq-1.5/jq-win64.exe'
};
const BIN_DIR = path.join(__dirname, '..', 'bin')
const FILEPATH = path.join(BIN_DIR, /^win32/.test(process.platform) ? './jq.exe' : './jq');
const LANGUAGES = ['jq'];
const EXECUTE_JQ_COMMAND = 'extension.executeJqCommand';
const CODE_LENS_TITLE = '[Execute jq]';

const Logger = vscode.window.createOutputChannel('jq output');

export function activate(context: vscode.ExtensionContext) {
    
    setupEnvironment()
        .then(() => {
            context.subscriptions.push(vscode.commands.registerCommand(EXECUTE_JQ_COMMAND, executeJqCommand));
            context.subscriptions.push(vscode.languages.registerCodeLensProvider(LANGUAGES, { provideCodeLenses }));
        })
        .catch(error => { 
            Logger.appendLine(error); 
        });
}

export function deactivate() {
}

function setupEnvironment(): Promise<any> {
    if (!fs.existsSync(BIN_DIR)) {
        fs.mkdirSync(BIN_DIR);
    }

    if (!fs.existsSync(FILEPATH)) {
        if (!BINARIES[process.platform]) {
            return Promise.reject(`Platform (${process.platform}) not supported!`);
        }

        Logger.append(`Download jq binary for platform (${process.platform})...`);
        return download(BINARIES[process.platform])
            .then(data => {
                fs.writeFileSync(FILEPATH, data);
                if (!/^win32/.test(process.platform)) {
                    fs.chmodSync(FILEPATH, '0777');
                }
                Logger.append(' [ OK ]');
                Logger.show();
            });
    }

    return Promise.resolve();
}

function provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken) {
    const matches:RegexMatch[] = findRegexes(document);
    return matches.map(match => new vscode.CodeLens(match.range, {
        title: CODE_LENS_TITLE,
        command: EXECUTE_JQ_COMMAND,
        arguments: [match]
    }));
}

interface RegexMatch {
    document: vscode.TextDocument;
    regex: RegExp;
    range: vscode.Range;
}

function findRegexes(document: vscode.TextDocument): RegexMatch[] {
    const matches: RegexMatch[] = [];
    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        let match: RegExpExecArray | null;
        const regex = /^(jq)\s+(.+?)/g;
        regex.lastIndex = 0;
        const text = line.text.substr(0, 1000);
        while ((match = regex.exec(text))) {
            const result = createRegexMatch(document, i, match);
            if (result) {
                matches.push(result);
            }
        }
    }
    return matches;
}

function createRegexMatch(document: vscode.TextDocument, line: number, match: RegExpExecArray) {
    const regex = createRegex(match[2], match[3]);
    if (regex) {
        return {
            document: document,
            regex: regex,
            range: new vscode.Range(line, 0, line, 2)
        };
    }
}

function createRegex(pattern: string, flags: string) {
    try {
        return new RegExp(pattern, flags);
    } catch (e) {
        // discard
    }
}

function executeJqCommand(params) {
    const document: vscode.TextDocument = params.document;
    const query: string = document
        .lineAt(params.range.start.line)
        .text.replace(/jq\s+/, '');
    const context:string = document.lineAt(params.range.start.line + 1).text;
    
    if (isUrl(context)) {
        download(context)
            .then(data => jqCommand(query, JSON.parse(data.toString())))
            .catch(err => {
                Logger.append(err);
                Logger.show();
            });
    } else if (isFilepath(context)) {
        const fileName:string = getFileName(document, context);
        if (fs.existsSync(fileName)) {
            jqCommand(query, JSON.parse(fs.readFileSync(fileName).toString()));
        }
    } else {
        const contextLines = [context];
        let line = params.range.start.line + 2;
        let lineText = '';
        while (line < document.lineCount && (lineText = document.lineAt(line++).text)) {
            contextLines.push(lineText)
        }
        jqCommand(query, JSON.parse(contextLines.join(' ')));
    }
}

function jqCommand(statement: string, jsonObj: any) {
    const process = child_process.spawn(FILEPATH, [statement]);
    process.stdin.write(JSON.stringify(jsonObj));
    process.stdin.end();

    process.stdout.on('data', data => {
        Logger.clear();
        Logger.append(data.toString());
        Logger.show();
    });

    process.stderr.on('data', error => {
        Logger.append('[ERROR] - ' + error.toString());
        Logger.show();
    });
}

function isUrl(context: string): boolean {
    return context.search(/^http(s)?/) !== -1;
}

function isFilepath(context: string): boolean  {
    return context.search(/^(\/|\.{1,2}\/|~\/)/) !== -1;
}

function getFileName(document: vscode.TextDocument, context: string): string {
    if (context.search('/') === 0) {
        return context;
    } else {
        return path.join(path.dirname(document.fileName), context);
    }
}
