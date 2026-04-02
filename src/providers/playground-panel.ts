import * as fs from "node:fs";
import * as path from "node:path";
import * as Effect from "effect/Effect";
import * as Runtime from "effect/Runtime";
import * as vscode from "vscode";
import { VsCodeContext } from "../adapters/vscode-adapter";
import { JqExecutionService } from "../services/jq-execution-service";

// --- Message protocol ---

type WebviewMessage =
  | { type: "execute"; filter: string; filePath: string }
  | { type: "pickFile" }
  | { type: "ready" };

type ExtensionMessage =
  | { type: "result"; output: string; isError: boolean }
  | {
      type: "filePicked";
      fileName: string;
      filePath: string;
    };

// --- File picker ---

const collectJsonSources = (): Array<{
  label: string;
  description: string;
  filePath: string;
}> => {
  const items: Array<{
    label: string;
    description: string;
    filePath: string;
  }> = [];

  // Open editor tabs
  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      if (tab.input instanceof vscode.TabInputText) {
        const uri = tab.input.uri;
        if (
          uri.scheme === "file" &&
          (uri.fsPath.endsWith(".json") || uri.fsPath.endsWith(".jsonl"))
        ) {
          items.push({
            label: `$(file) ${path.basename(uri.fsPath)}`,
            description: `Open editor - ${vscode.workspace.asRelativePath(uri)}`,
            filePath: uri.fsPath,
          });
        }
      }
    }
  }

  return items;
};

const pickJsonFile = async (): Promise<
  { fileName: string; filePath: string } | undefined
> => {
  const openEditorItems = collectJsonSources();

  // Workspace JSON files
  const workspaceFiles = await vscode.workspace.findFiles(
    "**/*.json",
    "**/node_modules/**",
    50
  );
  const workspaceItems = workspaceFiles.map((uri) => ({
    label: `$(search) ${path.basename(uri.fsPath)}`,
    description: vscode.workspace.asRelativePath(uri),
    filePath: uri.fsPath,
  }));

  const allItems = [
    ...(openEditorItems.length > 0
      ? [
          { label: "Open Editors", kind: vscode.QuickPickItemKind.Separator },
          ...openEditorItems,
        ]
      : []),
    ...(workspaceItems.length > 0
      ? [
          {
            label: "Workspace Files",
            kind: vscode.QuickPickItemKind.Separator,
          },
          ...workspaceItems,
        ]
      : []),
  ] as Array<vscode.QuickPickItem & { filePath?: string }>;

  const picked = await vscode.window.showQuickPick(allItems, {
    placeHolder: "Select a JSON file",
    matchOnDescription: true,
  });

  if (!picked?.filePath) {
    return undefined;
  }

  return {
    fileName: path.basename(picked.filePath),
    filePath: picked.filePath,
  };
};

// --- Webview HTML ---

const getWebviewHtml = (
  webview: vscode.Webview,
  _extensionUri: vscode.Uri
): string => {
  const nonce = getNonce();
  const cspSource = webview.cspSource;

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>jq Playground</title>
  <style nonce="${nonce}">
    :root {
      --gap: 8px;
      --radius: 4px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: var(--gap);
      height: 100vh;
      display: flex;
      flex-direction: column;
      gap: var(--gap);
    }

    /* Toolbar */
    .toolbar {
      display: flex;
      gap: var(--gap);
      align-items: center;
      flex-shrink: 0;
      flex-wrap: wrap;
    }
    .toolbar button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 4px 12px;
      border-radius: var(--radius);
      cursor: pointer;
      font-size: var(--vscode-font-size);
      white-space: nowrap;
    }
    .toolbar button:hover {
      background: var(--vscode-button-hoverBackground);
    }

    /* File chips */
    .file-chips {
      display: flex;
      gap: 6px;
      align-items: center;
      flex-wrap: wrap;
    }
    .file-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 0.85em;
      cursor: pointer;
      background: transparent;
      color: var(--vscode-foreground);
      border: 1px solid var(--vscode-widget-border, #555);
      white-space: nowrap;
    }
    .file-chip:hover {
      border-color: var(--vscode-focusBorder);
    }
    .file-chip.active {
      border-color: var(--vscode-focusBorder);
    }
    .file-chip .remove {
      cursor: pointer;
      opacity: 0.6;
      font-size: 1em;
      line-height: 1;
    }
    .file-chip .remove:hover {
      opacity: 1;
    }

    /* Filter area */
    .filter-section {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .filter-section label {
      font-size: 0.85em;
      color: var(--vscode-descriptionForeground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    #filter {
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, transparent);
      padding: 6px 8px;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: var(--vscode-editor-font-size, 13px);
      border-radius: var(--radius);
      resize: vertical;
      min-height: 36px;
    }
    #filter:focus {
      outline: 1px solid var(--vscode-focusBorder);
    }

    /* JSON panels */
    .panels {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--gap);
      min-height: 0;
    }
    .panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      border: 1px solid var(--vscode-panel-border, var(--vscode-widget-border, transparent));
      border-radius: var(--radius);
      overflow: hidden;
    }
    .panel-header {
      font-size: 0.85em;
      color: var(--vscode-descriptionForeground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 8px;
      background: var(--vscode-sideBar-background, transparent);
      flex-shrink: 0;
    }
    .panel pre {
      flex: 1;
      overflow: auto;
      padding: 8px;
      margin: 0;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: var(--vscode-editor-font-size, 13px);
      white-space: pre-wrap;
      word-break: break-word;
      background: var(--vscode-editor-background);
    }
    .panel pre.error {
      color: var(--vscode-errorForeground, #f44);
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button id="runBtn" title="Run jq filter (Cmd+Enter)">▶ Run</button>
    <button id="pickFileBtn" title="Select a JSON file from workspace or open editors">📂 Pick File</button>
    <div class="file-chips" id="fileChips"></div>
  </div>

  <div class="filter-section">
    <label>Filter</label>
    <textarea id="filter" rows="2" placeholder="." spellcheck="false">.</textarea>
  </div>

  <div class="panels">
    <div class="panel">
      <div class="panel-header">Output</div>
      <pre id="output"></pre>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const filterEl = document.getElementById('filter');
    const outputEl = document.getElementById('output');
    const pickFileBtn = document.getElementById('pickFileBtn');
    const runBtn = document.getElementById('runBtn');
    const fileChipsEl = document.getElementById('fileChips');

    const MAX_FILES = 4;
    // files: [{ fileName, filePath }], activeIndex: number | null
    let files = [];
    let activeIndex = null;

    // Restore state
    const state = vscode.getState() || {};
    if (state.filter) filterEl.value = state.filter;
    if (state.files) files = state.files;
    if (state.activeIndex != null && state.activeIndex < files.length) activeIndex = state.activeIndex;

    const saveState = () => {
      vscode.setState({ filter: filterEl.value, files, activeIndex });
    };

    const renderChips = () => {
      fileChipsEl.innerHTML = '';
      files.forEach((f, i) => {
        const chip = document.createElement('span');
        chip.className = 'file-chip' + (i === activeIndex ? ' active' : '');
        chip.title = f.filePath;

        const label = document.createElement('span');
        label.textContent = (i === activeIndex ? '✓ ' : '') + f.fileName;
        label.addEventListener('click', () => { activeIndex = i; saveState(); renderChips(); });

        const remove = document.createElement('span');
        remove.className = 'remove';
        remove.textContent = '×';
        remove.addEventListener('click', (e) => {
          e.stopPropagation();
          files.splice(i, 1);
          if (activeIndex === i) activeIndex = files.length > 0 ? 0 : null;
          else if (activeIndex > i) activeIndex--;
          saveState();
          renderChips();
        });

        chip.appendChild(label);
        chip.appendChild(remove);
        fileChipsEl.appendChild(chip);
      });
    };

    renderChips();

    const run = () => {
      const filter = filterEl.value.trim() || '.';
      if (activeIndex == null || !files[activeIndex]) {
        outputEl.textContent = 'No file selected — pick a JSON file first';
        outputEl.className = 'error';
        return;
      }
      outputEl.textContent = 'Running...';
      outputEl.className = '';
      vscode.postMessage({ type: 'execute', filter, filePath: files[activeIndex].filePath });
      saveState();
    };

    pickFileBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'pickFile' });
    });

    runBtn.addEventListener('click', run);

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        run();
      }
    });

    filterEl.addEventListener('input', saveState);

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'result') {
        outputEl.textContent = msg.output;
        outputEl.className = msg.isError ? 'error' : '';
      } else if (msg.type === 'filePicked') {
        // Check if already in list
        const existing = files.findIndex(f => f.filePath === msg.filePath);
        if (existing >= 0) {
          activeIndex = existing;
        } else {
          if (files.length >= MAX_FILES) files.shift();
          files.push({ fileName: msg.fileName, filePath: msg.filePath });
          activeIndex = files.length - 1;
        }
        saveState();
        renderChips();
      }
    });

    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
};

const getNonce = (): string => {
  let text = "";
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
};

// --- Panel command (Effect-based) ---

const currentWorkingDirectory = (): string => {
  const folders = vscode.workspace.workspaceFolders;
  return folders?.[0]?.uri.fsPath ?? ".";
};

export const openPlaygroundPanel = () =>
  Effect.gen(function* () {
    const context = yield* VsCodeContext;
    const jqExecution = yield* JqExecutionService;
    const runtime = yield* Effect.runtime<JqExecutionService>();
    const runFork = Runtime.runFork(runtime);

    const panel = vscode.window.createWebviewPanel(
      "jqpgPlayground",
      "jq Playground",
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [context.extensionUri],
      }
    );

    panel.iconPath = vscode.Uri.joinPath(context.extensionUri, "icon.png");
    panel.webview.html = getWebviewHtml(panel.webview, context.extensionUri);

    const postMessage = (msg: ExtensionMessage) => {
      panel.webview.postMessage(msg);
    };

    panel.webview.onDidReceiveMessage(
      (msg: WebviewMessage) => {
        switch (msg.type) {
          case "execute": {
            const cwd = currentWorkingDirectory();
            const args = [msg.filter];
            const json = fs.readFileSync(msg.filePath, "utf-8");
            runFork(
              jqExecution.execute(args, json, { cwd }).pipe(
                Effect.tap((output) =>
                  Effect.sync(() =>
                    postMessage({ type: "result", output, isError: false })
                  )
                ),
                Effect.catchAll((err) =>
                  Effect.sync(() =>
                    postMessage({
                      type: "result",
                      output: err.message,
                      isError: true,
                    })
                  )
                )
              )
            );
            break;
          }
          case "pickFile": {
            pickJsonFile().then((result) => {
              if (result) {
                postMessage({
                  type: "filePicked",
                  fileName: result.fileName,
                  filePath: result.filePath,
                });
              }
            });
            break;
          }
          case "ready":
            break;
          default:
            break;
        }
      },
      undefined,
      context.subscriptions
    );

    context.subscriptions.push(panel);
  });
