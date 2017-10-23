# VSCode jq playground

Visual Code jq playground allow to create a notebook with [jq](https://stedolan.github.io/jq/) commands

Check jq [tutorial](https://stedolan.github.io/jq/tutorial/) or [manual](https://stedolan.github.io/jq/tutorial/)

## Demo

![vscode-jq-playground](https://media.giphy.com/media/3ohhwkqXNc3hrmoECI/giphy.gif)

## Main Features

* Create notebook that contain description text and json query command
* JSON can be
    * embedded into document
    * file on filesystem
    * http resource
* Highlighting inline json code
* Autocomplete filename from workspace opened file

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


### JSON file from http request
```
# Example from jq tutorial https://stedolan.github.io/jq/tutorial/
jq .[0] | {message: .commit.message, name: .commit.committer.name}
https://api.github.com/repos/stedolan/jq/commits?per_page=5
```

## TODO

- [ ] Better error reporting
- [ ] Support (testing) windows filesystem
- [ ] Store intermediate and share it between jq queries
- [ ] Autocomplete


## Thanks

I be inspired by [vscode-jq](https://marketplace.visualstudio.com/items?itemName=dandric.vscode-jq)
