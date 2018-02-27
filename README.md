# VSCode jq playground

Visual Code jq playground allow to create a notebook with [jq](https://stedolan.github.io/jq/) commands

Check jq [tutorial](https://stedolan.github.io/jq/tutorial/) or [manual](https://stedolan.github.io/jq/tutorial/)

## Demo

### Usage example

![vscode-jq-playground](https://media.giphy.com/media/3ohhwkqXNc3hrmoECI/giphy.gif)

### Execute query online (jqplay)

![jqplay](https://media.giphy.com/media/3ov9k1k8R0jSttJUT6/giphy.gif)

### Try to use JSON Object with non string keys.

![bad-json](https://media.giphy.com/media/3o6fJ0kIg5QTHjtloQ/giphy.gif)

## Main Features

* Create notebook that contain description text and json query command
* JSON can be
  * embedded into document
  * file on filesystem
  * http resource
* Highlighting inline json code
* Autocomplete filename from workspace opened file
* Execute jq command and show result in new text editor
* Execute jq query online on [jqplay.org](https://jqplay.org) and share snippet
* Open manual and tutorial from command
* Support non string keys
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

## TODO

* [x] Run jq query with hotkeys
* [ ] Better error reporting
* [ ] Support (testing) windows filesystem (is there someone who test it on windows?)
* [x] Store intermediate and share it between jq queries
* [ ] Autocomplete

## Thanks

I be inspired by [vscode-jq](https://marketplace.visualstudio.com/items?itemName=dandric.vscode-jq)
