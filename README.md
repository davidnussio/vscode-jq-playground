# VSCode jq playground

Visual Code jq playground allow to create a notebook with [jq](https://stedolan.github.io/jq/) commands

Check jq [tutorial](https://stedolan.github.io/jq/tutorial/) or [manual](https://stedolan.github.io/jq/tutorial/)

[![Latest Release](https://vsmarketplacebadge.apphb.com/version-short/davidnussio.vscode-jq-playground.svg)](https://marketplace.visualstudio.com/items?itemName=davidnussio.vscode-jq-playground)
[![Installs](https://vsmarketplacebadge.apphb.com/installs-short/davidnussio.vscode-jq-playground.svg)](https://marketplace.visualstudio.com/items?itemName=davidnussio.vscode-jq-playground)
[![Installs](https://vsmarketplacebadge.apphb.com/downloads-short/davidnussio.vscode-jq-playground.svg)](https://marketplace.visualstudio.com/items?itemName=davidnussio.vscode-jq-playground)
[![Rating](https://vsmarketplacebadge.apphb.com/rating-short/davidnussio.vscode-jq-playground.svg)](https://marketplace.visualstudio.com/items?itemName=davidnussio.vscode-jq-playground)

## Demo

### JQ Manual examples

![jq-manual-examples](https://raw.githubusercontent.com/davidnussio/vscode-jq-playground/master/images/general-demo.gif)

### Usage example

![vscode-jq-payground](https://raw.githubusercontent.com/davidnussio/vscode-jq-playground/master/images/example_multiline.gif)

![vscode-jq-playground](https://github.com/davidnussio/vscode-jq-playground/raw/master/images/buffers-examples.gif)

### Autocomplete with inline documentation

![Autocomplete](https://media.giphy.com/media/eHFSm80lXQnxQe2D64/giphy.gif)

## Main Features

- Create notebook with multiple executable jq filters in one file
- Support different data inputs:
  - json text
  - string
  - url
  - file
  - workspace buffer and file
  - command line (limited)
- Support [input variable](https://code.visualstudio.com/docs/editor/variables-reference#_input-variables)
- Redirect output
- Command lines as input with variables support
- Highlighting code
- Autocomplete with documentation and examples
- Open command filter result in output console or in new buffer
- Open examples from jq manual and run it (ctrl+shift+p → jq playground: Examples)
- Support hotkeys
  - ctrl+enter → to output
  - shift+enter → to editor

## Usage

Open new file and change _'Language Mode'_ to `jqpg` (JQ PlayGround) or
use a file with `.jqpg` extension.

### Start write jq filters

```
jq [options] <jq filter>
[ JSON_TEXT | STRINGS | URL | FILE | COMMAND_LINE ]
```

### Open official jq examples in jq playground

```
Command Palette... (ctrl + shift + p): jq playground: Examples
```

### JSON_TEXT

```json
# Example 1
jq '.foo'
{"foo": 42, "bar": "less interesting data"}

# Example 2
jq '.foo'
{
    "foo": 42,
    "bar": "less interesting data"
}
```

### STRINGS

```json
# Example 1: raw input string
jq -R 'split(" ")'
non arcu risus quis varius quam quisque id diam vel

# Example 2
jq .[5:10]
"less interesting data"
```

### URL

```json
# Example 1
jq '.[0] | {message: .commit.message, name: .commit.committer.name}'
https://api.github.com/repos/stedolan/jq/commits?per_page=5
```

### FILE

```json
# Example 1: relative pahts
jq '.foo,.bar'
../files/example.json

# Example 2: absolute pahts
jq '.foo,.bar'
/home/dev/files/example.json

# Example 3: buffer file
jq '.'
Untitled-1

# Example 4: workspace file
jq '.'
opened-workspace-file-with-data.json

# Example 5 (Multifile)
jq '{
    (input_filename|rtrimstr(".json")) :
    .scripts | keys | map(select(. | contains("test"))) }'
/home/dev/client/package.json /home/dev/server/package.json
```

### COMMAND_LINE

```json
# Example 1
jq '.token'
$ curl -X GET "http://httpbin.org/bearer" -H "accept: application/json" -H "Authorization: Bearer 1234"

# Example 2
jq -R -s 'split("\n") | .[] | { file: ., lenght: . | length}'
$ ls /etc/
```

### COMMAND_LINE (with variables)

```json
TOKEN = 1234
ENDPOINT = bearer

# Example 1
jq '.token'
$ curl -X GET "http://httpbin.org/$ENDPOINT" -H "accept: application/json" -H "Authorization: Bearer $TOKEN"

# Example 2
jq -R -s 'split("\n") | .[] | { file: ., lenght: . | length}'
$ ls $HOME
```

### Multiline jq filter

```json
# Example 1
jq -r '(map(keys)
  | add
  | unique) as $cols
  | map(. as $row
  | $cols
  | map($row[.])) as $rows
  | $cols, $rows[]
  | @csv'
[
    {"code": "NSW", "name": "New South Wales", "level":"state", "country": "AU"},
    {"code": "AB", "name": "Alberta", "level":"province", "country": "CA"},
    {"code": "ABD", "name": "Aberdeenshire", "level":"council area", "country": "GB"},
    {"code": "AK", "name": "Alaska", "level":"state", "country": "US"}
]

# Exampmle 2
jq 'if . == 0 then
    "zero"
  elif . == 1 then
    "one"
  else
    "many"
  end
'
2
```

### Support jq command line options

```json
# Example 1
jq --slurp '. + [5] + [6]'
[
  1,
  2,
  3
]

# Example 2
jq --arg var val '.value = $var'
{}

# Example 3
jq --raw-input --slurp 'split("\\n")'
foo\nbar\nbaz

# Example 4
jq -r '(map(keys) | add | unique) as $cols | map(. as $row | $cols | map($row[.])) as $rows | $cols, $rows[] | @csv'
[
    {"code": "NSW", "name": "New South Wales", "level":"state", "country": "AU"},
    {"code": "AB", "name": "Alberta", "level":"province", "country": "CA"},
    {"code": "ABD", "name": "Aberdeenshire", "level":"council area", "country": "GB"},
    {"code": "AK", "name": "Alaska", "level":"state", "country": "US"}
]

# Example 5
jq --raw-output '"\(.one)\t\(.two)"'
{"one":1,"two":"x"}
```

## Use workspace file as command input or/and query filter

```json
# Opened workspace file as filter
jq opened-workspace-file-filter.jq
[1, 2, 3, 4, 5]

# Opened workspace file as filter and query input
jq opened-workspace-file-filter.jq
opened-workspace-file-with-data.json
```

## Redirect output's filter

```json
jq '[.[].url]'
> tmp.json
$ curl 'https://api.github.com/repos/stedolan/jq/commits?per_page=5'
```

## Available commands

http|curl|wget|cat|echo|ls|dir|grep|tail|head|find

### Input Variable

```json
{
  // See https://go.microsoft.com/fwlink/?LinkId=733558
  // for the documentation about the tasks.json format
  "version": "2.0.0",
  "tasks": [
    {
      "label": "jq test",
      "type": "shell",
      "command": "curl",
      "args": ["-v", "${input:urls}\\&param=${input:param}"],
      "problemMatcher": []
    }
  ],
  "inputs": [
    {
      "id": "urls",
      "type": "command",
      "command": "extension.executeJqInputCommand",
      "args": {
        "filter": ".[3]",
        "input": "/home/david/dev/tmp/jqpg-examples/tmp.json"
      }
    },
    {
      "id": "param",
      "type": "command",
      "command": "extension.executeJqInputCommand",
      "args": {
        "filter": ".[2]",
        "input": "[10, 50, 100]",
        "jsonInput": true
      }
    }
  ]
}
```

### Open online manual

`ctrl+shift+p → > Manual`

### Open online Tutoral

`ctrl+shift+p → > Tutorial`

### Execute online query (jqplay)

`ctrl+shift+p → > jqplay → .[] | { id: .userId, title: .title }`

## Contributors

Thanks for cwd module patching [💻](https://github.com/davidnussio/vscode-jq-playground/commits?author=jpandersen87) [Joseph Andersen](https://github.com/jpandersen87)

Thanks for updating deps and binary [💻](https://github.com/davidnussio/vscode-jq-playground/commits?author=yozlet) [Yoz Grahame](https://github.com/yozlet)

Thanks for input variable [💻](https://github.com/davidnussio/vscode-jq-playground/commits?author=JeffreyMercado) [Jeff Mercado](https://github.com/JeffreyMercado)

## Thanks

I be inspired by [vscode-jq](https://marketplace.visualstudio.com/items?itemName=dandric.vscode-jq)
