# jq Playground for VS Code

> An interactive jq notebook inside your editor. Write filters, pick your data source, see results instantly.

[![Version](https://img.shields.io/visual-studio-marketplace/v/davidnussio.vscode-jq-playground)](https://marketplace.visualstudio.com/items?itemName=davidnussio.vscode-jq-playground)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/davidnussio.vscode-jq-playground)](https://marketplace.visualstudio.com/items?itemName=davidnussio.vscode-jq-playground)
[![GitHub Issues](https://img.shields.io/github/issues/davidnussio/vscode-jq-playground)](https://github.com/davidnussio/vscode-jq-playground/issues)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![General demo](https://raw.githubusercontent.com/davidnussio/vscode-jq-playground/master/images/general-demo.gif)

---

## Features

- **Notebook-style editing** — multiple jq filters in a single `.jqpg` file, each with its own data source
- **Zero config** — auto-detects your system `jq`; can download it for you if missing
- **Rich data inputs** — inline JSON, local files, workspace buffers, URLs, shell commands
- **Smart autocomplete** — IntelliSense powered by the official jq builtins, with docs and examples
- **Output flexibility** — results to the output console, a side editor, or redirected to a file
- **Variables** — define `KEY=value` lines and reference `$KEY` in filters and commands
- **Multiline filters** — write complex queries across multiple lines using quotes
- **Syntax highlighting** — full TextMate grammar for jq and embedded JSON

---

## Quick start

1. Install the extension from the [Marketplace](https://marketplace.visualstudio.com/items?itemName=davidnussio.vscode-jq-playground)
2. Create a file with the `.jqpg` extension
3. Write a filter and press `Cmd+Enter` (macOS) / `Ctrl+Enter` (Windows/Linux)

```jq
jq '.name'
{"name": "Ada Lovelace", "year": 1815}
```

The result appears in the output panel. Use `Shift+Enter` to open it in a side editor instead.

---

## Data sources

Each filter block can pull data from a different source.

**Inline JSON**

```jq
jq '[.[] | select(.active)]'
[{"id": 1, "active": true}, {"id": 2, "active": false}]
```

**Local or workspace files**

```jq
jq '.dependencies | keys'
./package.json
```

**URLs**

```jq
jq '.[0].commit.message'
https://api.github.com/repos/stedolan/jq/commits?per_page=5
```

**Shell commands**

```jq
jq -R -s 'split("\n") | map(select(length > 0))'
$ ls -la
```

**Raw string input**

```jq
jq -R 'split(" ")'
Lorem ipsum dolor sit amet
```

---

## Variables and output redirection

Define variables before your filter and use them in commands or URLs:

```jq
TOKEN = "abc123"
ENDPOINT = "users"

jq '.results'
$ curl -s -H "Authorization: Bearer $TOKEN" "https://api.example.com/$ENDPOINT"
```

Redirect output to a file with `>` (overwrite) or `>>` (append):

```jq
jq '[.[] | .url]'
> urls.json
$ curl -s 'https://api.github.com/repos/stedolan/jq/commits?per_page=5'
```

---

## Commands and keybindings

| Keybinding | Action |
|---|---|
| `Cmd+Enter` / `Ctrl+Enter` | Run filter → output console |
| `Shift+Enter` | Run filter → side editor |

All commands are available via the Command Palette under the `JQPG` prefix:

| Command | Description |
|---|---|
| JQPG: Examples | Browse executable examples from the jq manual |
| JQPG: Manual | Open the official jq manual |
| JQPG: Tutorial | Open the jq tutorial |
| JQPG: Execute jq filter | Run a jq filter from an input box |
| JQPG: Create playground from filter | Scaffold a `.jqpg` file from a filter |
| JQPG: Configure jq path | Set a custom path to the jq binary |
| JQPG: Download jq binary | Download jq if not installed |

---

## Configuration

| Setting | Default | Description |
|---|---|---|
| `jqPlayground.binaryPath` | `""` | Path to the `jq` binary. Leave empty for auto-detection. |

---

## VS Code input variables

Use jq results as input variables in tasks and launch configs:

```json
{
  "inputs": [
    {
      "id": "apiUrl",
      "type": "command",
      "command": "extension.executeJqInputCommand",
      "args": {
        "filter": ".endpoints.api",
        "input": "./config.json"
      }
    }
  ]
}
```

---

## More examples

![Autocomplete](https://media.giphy.com/media/eHFSm80lXQnxQe2D64/giphy.gif)

![Multiple data sources](https://github.com/davidnussio/vscode-jq-playground/raw/master/images/buffers-examples.gif)

![Multiline filters](https://github.com/davidnussio/vscode-jq-playground/raw/master/images/multiline-demo.gif)

[See the interactive examples gallery →](https://davidnussio.github.io/vscode-jq-playground/)

---

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/davidnussio/vscode-jq-playground).

Thanks to all contributors:
[Joseph Andersen](https://github.com/jpandersen87),
[Yoz Grahame](https://github.com/yozlet),
[Jeff Mercado](https://github.com/JeffreyMercado),
[Leonel Galán](https://github.com/leonelgalan).

Inspired by [vscode-jq](https://marketplace.visualstudio.com/items?itemName=dandric.vscode-jq).

## License

[MIT](LICENSE)
