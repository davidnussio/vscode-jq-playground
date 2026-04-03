import * as fs from "node:fs";
import * as path from "node:path";
import * as Effect from "effect/Effect";
import * as Runtime from "effect/Runtime";
import * as vscode from "vscode";
import { VsCodeContext } from "../adapters/vscode-adapter";
import { builtins } from "../builtins";
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
    }
  | { type: "builtins"; keywords: string[] };

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

    /* Autocomplete */
    .filter-section {
      position: relative;
    }
    .autocomplete-list {
      position: absolute;
      left: 0;
      right: 0;
      z-index: 10;
      max-height: 180px;
      overflow-y: auto;
      background: var(--vscode-editorSuggestWidget-background, var(--vscode-input-background));
      border: 1px solid var(--vscode-editorSuggestWidget-border, var(--vscode-input-border, #555));
      border-radius: var(--radius);
      display: none;
      list-style: none;
    }
    .autocomplete-list.visible {
      display: block;
    }
    .autocomplete-list li {
      padding: 4px 8px;
      cursor: pointer;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: var(--vscode-editor-font-size, 13px);
      color: var(--vscode-editorSuggestWidget-foreground, var(--vscode-input-foreground));
    }
    .autocomplete-list li.active {
      background: var(--vscode-editorSuggestWidget-selectedBackground, var(--vscode-list-activeSelectionBackground));
      color: var(--vscode-editorSuggestWidget-selectedForeground, var(--vscode-list-activeSelectionForeground));
    }
    .autocomplete-list li .match {
      color: var(--vscode-editorSuggestWidget-highlightForeground, var(--vscode-focusBorder));
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
    <textarea id="filter" rows="3" placeholder="." spellcheck="false">.</textarea>
    <ul class="autocomplete-list" id="autocomplete"></ul>
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
    const acList = document.getElementById('autocomplete');

    let jqKeywords = [];
    let acIndex = -1;

    // --- Autocomplete helpers ---
    const getWordAtCursor = () => {
      const pos = filterEl.selectionStart;
      const text = filterEl.value.substring(0, pos);
      const match = text.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/);
      return match ? { word: match[1], start: pos - match[1].length, end: pos } : null;
    };

    const highlightMatch = (text, query) => {
      const idx = text.toLowerCase().indexOf(query.toLowerCase());
      if (idx < 0) return text;
      return text.substring(0, idx)
        + '<span class="match">' + text.substring(idx, idx + query.length) + '</span>'
        + text.substring(idx + query.length);
    };

    const showAc = (items, wordInfo) => {
      acList.innerHTML = '';
      acIndex = -1;
      if (items.length === 0) { acList.classList.remove('visible'); return; }
      // Position the list below the textarea
      acList.style.top = (filterEl.offsetTop + filterEl.offsetHeight) + 'px';
      items.forEach((kw, i) => {
        const li = document.createElement('li');
        li.innerHTML = highlightMatch(kw, wordInfo.word);
        li.addEventListener('mousedown', (e) => {
          e.preventDefault();
          applyCompletion(kw, wordInfo);
        });
        acList.appendChild(li);
      });
      acList.classList.add('visible');
    };

    const hideAc = () => { acList.classList.remove('visible'); acIndex = -1; };

    const applyCompletion = (keyword, wordInfo) => {
      const before = filterEl.value.substring(0, wordInfo.start);
      const after = filterEl.value.substring(wordInfo.end);
      filterEl.value = before + keyword + after;
      const newPos = wordInfo.start + keyword.length;
      filterEl.setSelectionRange(newPos, newPos);
      filterEl.focus();
      hideAc();
      saveState();
    };

    const updateAc = () => {
      if (jqKeywords.length === 0) { hideAc(); return; }
      const wordInfo = getWordAtCursor();
      if (!wordInfo || wordInfo.word.length < 1) { hideAc(); return; }
      const q = wordInfo.word.toLowerCase();
      const matches = jqKeywords.filter(k => k.toLowerCase().includes(q) && k.toLowerCase() !== q);
      showAc(matches.slice(0, 15), wordInfo);
    };

    filterEl.addEventListener('input', () => { saveState(); updateAc(); });
    filterEl.addEventListener('blur', () => { setTimeout(hideAc, 150); });
    filterEl.addEventListener('keydown', (e) => {
      if (!acList.classList.contains('visible')) return;
      const items = acList.querySelectorAll('li');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        acIndex = Math.min(acIndex + 1, items.length - 1);
        items.forEach((li, i) => li.classList.toggle('active', i === acIndex));
        items[acIndex]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        acIndex = Math.max(acIndex - 1, 0);
        items.forEach((li, i) => li.classList.toggle('active', i === acIndex));
        items[acIndex]?.scrollIntoView({ block: 'nearest' });
      } else if ((e.key === 'Enter' || e.key === 'Tab') && acIndex >= 0) {
        e.preventDefault();
        const wordInfo = getWordAtCursor();
        if (wordInfo && items[acIndex]) {
          applyCompletion(items[acIndex].textContent, wordInfo);
        }
      } else if (e.key === 'Escape') {
        hideAc();
      }
    });

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

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'result') {
        outputEl.textContent = msg.output;
        outputEl.className = msg.isError ? 'error' : '';
      } else if (msg.type === 'builtins') {
        jqKeywords = msg.keywords || [];
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

// Shared logic for setting up webview messaging
const setupWebview = (
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  subscriptions: vscode.Disposable[],
  jqExecution: Effect.Effect.Success<typeof JqExecutionService>,
  // biome-ignore lint/suspicious/noExplicitAny: Effect runtime fork type is complex
  runFork: (effect: Effect.Effect<any, any, any>) => any
) => {
  webview.options = {
    enableScripts: true,
    localResourceRoots: [extensionUri],
  };
  webview.html = getWebviewHtml(webview, extensionUri);

  const postMessage = (msg: ExtensionMessage) => {
    webview.postMessage(msg);
  };

  const disposable = webview.onDidReceiveMessage((msg: WebviewMessage) => {
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
        postMessage({
          type: "builtins",
          keywords: Object.keys(builtins),
        });
        break;
      default:
        break;
    }
  });

  subscriptions.push(disposable);
};

// --- Sidebar WebviewViewProvider ---

export const playgroundViewProvider = Effect.gen(function* () {
  const context = yield* VsCodeContext;
  const jqExecution = yield* JqExecutionService;
  const runtime = yield* Effect.runtime<JqExecutionService>();
  const runFork = Runtime.runFork(runtime);

  return {
    resolveWebviewView(webviewView: vscode.WebviewView) {
      setupWebview(
        webviewView.webview,
        context.extensionUri,
        context.subscriptions,
        jqExecution,
        runFork
      );
    },
  } satisfies vscode.WebviewViewProvider;
});

// --- Standalone panel command ---

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

    setupWebview(
      panel.webview,
      context.extensionUri,
      context.subscriptions,
      jqExecution,
      runFork
    );

    context.subscriptions.push(panel);
  });
