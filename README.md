# VSCode jq playground

Visual Code jq playground allow to create a notebook with [jq](https://stedolan.github.io/jq/) commands

Check jq [tutorial](https://stedolan.github.io/jq/tutorial/) or [manual](https://stedolan.github.io/jq/tutorial/)

## Demo

### JQ Manual examples

![jq-manual-examples](https://media.giphy.com/media/fs3AFamgsr9Qw7yvgN/giphy.gif)


### Usage example

![vscode-jq-payground](https://media.giphy.com/media/d7ffrUyHrXinEvrMrU/giphy.gif)

![vscode-jq-playground](https://media.giphy.com/media/3ohhwkqXNc3hrmoECI/giphy.gif)

### Autocomplete with inline documentation

![Autocomplete](https://media.giphy.com/media/eHFSm80lXQnxQe2D64/giphy.gif)



## Main Features

* Create notebook with jq query filters
* Support data input as:
  * embedded documents
  * filesystem files
  * http resource
* Support jq query filter as:
  * inline
  * opened workspace files
* Highlighting code
* Autocomplete with documentation and examples
* Open command filter result in output console or in new editor file
* Open examples from jq manual and run it (ctrl+shift+p → jq playground: Examples)
* Support hotkeys
  * ctrl+enter → to output
  * shift+enter → to editor

## Usage

Create file with `.jq` extension and then write jq command with json

```json
# Example 1: json file
jq .[2]
/home/dev/files/example.json

# Example 1: json inline
jq .[2]
{"foo": 42, "bar": "less interesting data"}
```

### JSON inline

```json
# Value at key example from https://jqplay.org/
jq .foo
{"foo": 42, "bar": "less interesting data"}

# Same example with formatted json
jq .foo
{
    "foo": 42,
    "bar": "less interesting data"
}
```

- test
  - f
  - d

### JSON file from filesystem

```json
# Use relative pahts
jq .foo,.bar
../files/example.json

# Use absolute pahts
jq .foo,.bar
/home/dev/files/example.json

# Unsaved temporary file
jq .
Untitled-1
```

### Support jq command line options

```json
jq --slurp . + [5] + [6]
[
  1,
  2,
  3
]

# Multi value arguments
jq --arg var val .value = $var
{}

jq --raw-input --slurp split("\\n")
foo\nbar\nbaz

jq -r (map(keys) | add | unique) as $cols | map(. as $row | $cols | map($row[.])) as $rows | $cols, $rows[] | @csv
[
    {"code": "NSW", "name": "New South Wales", "level":"state", "country": "AU"},
    {"code": "AB", "name": "Alberta", "level":"province", "country": "CA"},
    {"code": "ABD", "name": "Aberdeenshire", "level":"council area", "country": "GB"},
    {"code": "AK", "name": "Alaska", "level":"state", "country": "US"}
]

jq --raw-output "\(.one)\t\(.two)"
{"one":1,"two":"x"}
```

### Multiline query filter (quoted string 'filter...')

```json
# Multiline query filter
jq 'if . == 0 then
    "zero"
  elif . == 1 then
    "one"
  else
    "many"
  end
'
2

# Multiline query filter
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
```

### Use workspace file as command input or query filter

```json
# Opened workspace file as filter
jq opened-workspace-file-filter.jq
[1, 2, 3, 4, 5]

# Opened workspace file as filter and query input
jq opened-workspace-file-filter.jq
opened-workspace-file-with-data.json
```

### Open online manual

`ctrl+shift+p → > Manual`

### Open online Tutoral

`ctrl+shift+p → > Tutorial`

### Execute online query (jqplay)

`ctrl+shift+p → > jqplay → .[] | { id: .userId, title: .title }`

### JSON file from http request

```
# Example from jq tutorial https://stedolan.github.io/jq/tutorial/
jq .[0] | {message: .commit.message, name: .commit.committer.name}
https://api.github.com/repos/stedolan/jq/commits?per_page=5
```

## Contributors

Thanks for cwd module patching [Joseph Andersen](https://github.com/jpandersen87)

## Thanks

I be inspired by [vscode-jq](https://marketplace.visualstudio.com/items?itemName=dandric.vscode-jq)

