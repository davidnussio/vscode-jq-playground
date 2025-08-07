# 🚀 VSCode jq Playground

> **Transform JSON like a wizard with the most powerful jq extension for VS Code!**

Turn VS Code into an interactive **jq notebook** where you can experiment, learn, and master JSON transformations with real-time feedback. No more switching between terminals and editors – everything you need is right here!

[![Latest Release](https://vsmarketplacebadge.apphb.com/version-short/davidnussio.vscode-jq-playground.svg)](https://marketplace.visualstudio.com/items?itemName=davidnussio.vscode-jq-playground)
[![Installs](https://vsmarketplacebadge.apphb.com/installs-short/davidnussio.vscode-jq-playground.svg)](https://marketplace.visualstudio.com/items?itemName=davidnussio.vscode-jq-playground)
[![Downloads](https://vsmarketplacebadge.apphb.com/downloads-short/davidnussio.vscode-jq-playground.svg)](https://marketplace.visualstudio.com/items?itemName=davidnussio.vscode-jq-playground)
[![Rating](https://vsmarketplacebadge.apphb.com/rating-short/davidnussio.vscode-jq-playground.svg)](https://marketplace.visualstudio.com/items?itemName=davidnussio.vscode-jq-playground)

[![Open Issues](https://img.shields.io/github/issues/davidnussio/vscode-jq-playground)](https://github.com/davidnussio/vscode-jq-playground/issues)
[![Closed Issues](https://img.shields.io/github/issues-closed/davidnussio/vscode-jq-playground)](https://github.com/davidnussio/vscode-jq-playground/issues?q=is%3Aissue+is%3Aclosed)

---

## ✨ Why You'll Love This Extension

🎯 **Interactive Learning** - Practice jq with instant feedback  
⚡ **Zero Setup** - Works out of the box, no jq installation needed  
📔 **Notebook Style** - Multiple filters in one file with different data sources  
🔍 **Smart Autocomplete** - IntelliSense with documentation and examples  
🌐 **Versatile Input** - JSON, URLs, files, command outputs, and more  
🎨 **Beautiful Syntax** - Highlighting for both jq and JSON  
⌨️ **Power User Ready** - Hotkeys, variables, and advanced features

---

## 🎬 See It In Action

### 🚀 Quick Start: From Filter to Playground in Seconds

![Create playground from filter](https://github.com/davidnussio/vscode-jq-playground/raw/master/images/inputbox-1.gif)

> **One command** creates a complete playground with your filter ready to test!

### 💨 Lightning Fast JSON Filtering

![Filter JSON on the fly](https://github.com/davidnussio/vscode-jq-playground/raw/master/images/inputbox-2.gif)

> **Type, execute, see results instantly** - no context switching needed!

### 📚 Learn with Official jq Examples

![jq manual examples](https://raw.githubusercontent.com/davidnussio/vscode-jq-playground/master/images/general-demo.gif)

> **Explore hundreds of real examples** from the official jq manual - perfect for learning!

### 🎯 Intelligent Autocomplete

![Autocomplete with documentation](https://media.giphy.com/media/eHFSm80lXQnxQe2D64/giphy.gif)

> **Smart suggestions with inline docs** - discover jq functions as you type!

### 📄 Work with Multiple Files and Complex Data

![Multiple data sources](https://github.com/davidnussio/vscode-jq-playground/raw/master/images/buffers-examples.gif)

> **Mix and match data sources** - files, URLs, command outputs, all in one playground!

[**🌐 See More Interactive Examples**](https://davidnussio.github.io/vscode-jq-playground/)

---

## 🛠️ Powerful Features That Save You Time

### 📔 **Notebook-Style Development**

- Create multiple executable jq filters in one file
- Mix different data sources within the same document
- Perfect for experimentation and documentation

### 🎯 **Versatile Data Inputs**

- **📝 JSON Text** - Paste JSON directly into your playground
- **🔤 Raw Strings** - Process text data with raw input mode
- **🌐 URLs** - Fetch and filter data from APIs in real-time
- **📁 Files** - Local files, workspace files, even unsaved buffers
- **💻 Command Line** - Execute commands and filter their output
- **🔧 Variables** - Support for VS Code input variables and custom variables

### 🚀 **Developer Experience**

- **⌨️ Smart Hotkeys** - `Ctrl+Enter` to output, `Shift+Enter` to editor
- **💡 IntelliSense** - Autocomplete with documentation and examples
- **🎨 Syntax Highlighting** - Beautiful syntax highlighting for jq and JSON
- **📖 Built-in Examples** - Access official jq manual examples instantly
- **📤 Output Redirection** - Save results directly to files
- **🔍 Error Reporting** - Clear error messages and debugging support

---

## 🚀 Quick Start Guide

### 1️⃣ **Get Started in 10 Seconds**

1. Open VS Code
2. Install the extension
3. Create a new file with `.jqpg` extension (or set language mode to "jqpg")
4. Start writing jq filters!

### 2️⃣ **Basic Syntax**

```jq
jq [options] '<your-filter>'
[your-data-here]
```

### 3️⃣ **Try Your First Filter**

```jq
# Extract specific field from JSON
jq '.name'
{"name": "John Doe", "age": 30, "city": "New York"}
```

**💡 Pro Tip**: Press `Ctrl+Enter` to run the filter and see instant results!

---

## 📚 Learn by Example

### 🔧 **JSON Processing Made Simple**

```jq
# Extract nested data
jq '.user.profile.email'
{
  "user": {
    "profile": {
      "email": "john@example.com",
      "name": "John Doe"
    }
  }
}
```

### 🌐 **Fetch and Filter APIs in Real-Time**

```jq
# Get commit messages from GitHub API
jq '.[0] | {message: .commit.message, author: .commit.committer.name}'
https://api.github.com/repos/stedolan/jq/commits?per_page=5
```

### 🔤 **Process Raw Text Data**

```jq
# Split text into words
jq -R 'split(" ")'
Lorem ipsum dolor sit amet consectetur adipiscing elit
```

### 📁 **Work with Files**

```jq
# Process local or workspace files
jq '.scripts | keys | map(select(contains("test")))'
./package.json

# Multiple files at once
jq '{(input_filename|rtrimstr(".json")): .version}'
./client/package.json ./server/package.json
```

### 💻 **Execute Commands and Filter Results**

```jq
# List files with details
jq -R -s 'split("\n") | map(select(length > 0)) | map({file: ., size: length})'
$ ls -la /etc/
```

### 🔧 **Use Variables for Dynamic Queries**

```jq
# Define variables at the top
TOKEN = "your-api-key"
ENDPOINT = "users"

# Use them in your commands
jq '.data[] | select(.active == true)'
$ curl -H "Authorization: Bearer $TOKEN" "https://api.example.com/$ENDPOINT"
```

### 📝 **Complex Multi-line Filters**

```jq
# Convert array of objects to CSV format
jq -r '(map(keys) | add | unique) as $cols
  | map(. as $row | $cols | map($row[.])) as $rows
  | $cols, $rows[]
  | @csv'
[
  {"name": "Alice", "age": 30, "city": "NYC"},
  {"name": "Bob", "age": 25, "city": "LA"}
]
```

### 💾 **Save Results to Files**

```jq
# Redirect output to a file
jq '[.[] | .url]'
> api-urls.json
$ curl 'https://api.github.com/repos/stedolan/jq/commits?per_page=5'
```

---

## ⌨️ Essential Commands & Hotkeys

| Command                           | Action                                |
| --------------------------------- | ------------------------------------- |
| `Ctrl+Enter`                      | Execute filter → output to console    |
| `Shift+Enter`                     | Execute filter → output to new editor |
| `Ctrl+Shift+P` → "JQPG: Examples" | Browse official jq examples           |
| `Ctrl+Shift+P` → "JQPG: Manual"   | Open jq manual                        |
| `Ctrl+Shift+P` → "JQPG: Tutorial" | Open jq tutorial                      |

**💡 Available Commands**: `http` `curl` `wget` `cat` `echo` `ls` `dir` `grep` `tail` `head` `find`

---
  
## 🔧 Advanced Features

### 🎯 **VS Code Input Variables Integration**

Use jq results as input variables in your VS Code tasks:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "API Call with jq",
      "type": "shell",
      "command": "curl",
      "args": ["-v", "${input:apiUrl}"],
      "problemMatcher": []
    }
  ],
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

### 📚 **Learning Resources Built-in**

- **Examples Library**: `Ctrl+Shift+P` → "JQPG: Examples" - Browse 100+ real examples
- **Official Manual**: `Ctrl+Shift+P` → "JQPG: Manual" - Complete jq reference
- **Interactive Tutorial**: `Ctrl+Shift+P` → "JQPG: Tutorial" - Learn jq step by step

---

## 🎉 Why Developers Choose This Extension

> _"Finally, a jq environment that doesn't make me switch between 10 different tools!"_

> _"The autocomplete with examples is a game-changer for learning jq."_

> _"I can test API responses and build filters in the same place - love it!"_

**Perfect for:**

- 🔍 **API Development** - Test and debug API responses
- 📊 **Data Analysis** - Transform and analyze JSON data
- 🎓 **Learning jq** - Interactive examples and documentation
- 🛠️ **DevOps** - Process configuration files and logs
- 🔧 **Automation** - Build data pipelines with VS Code tasks

---

## 📖 Getting Started Resources

- 🎯 [Official jq Tutorial](https://stedolan.github.io/jq/tutorial/) - Learn the basics
- 📚 [Complete jq Manual](https://stedolan.github.io/jq/manual/v1.6/) - Full reference
- 🌐 [Interactive Examples](https://davidnussio.github.io/vscode-jq-playground/) - Try it online
- 💡 Built-in examples: `Ctrl+Shift+P` → "JQPG: Examples"

---

## 🤝 Contributors & Acknowledgments

Special thanks to our amazing contributors:

- **[Joseph Andersen](https://github.com/jpandersen87)** [💻](https://github.com/davidnussio/vscode-jq-playground/commits?author=jpandersen87) - CWD module patching
- **[Yoz Grahame](https://github.com/yozlet)** [💻](https://github.com/davidnussio/vscode-jq-playground/commits?author=yozlet) - Dependencies and binary updates
- **[Jeff Mercado](https://github.com/JeffreyMercado)** [💻](https://github.com/davidnussio/vscode-jq-playground/commits?author=JeffreyMercado) - Input variables feature
- **[Leonel Galán](https://github.com/leonelgalan)** [💻](https://github.com/davidnussio/vscode-jq-playground/commits?author=leonelgalan) - Input variables enhancement

_Inspired by [vscode-jq](https://marketplace.visualstudio.com/items?itemName=dandric.vscode-jq)_

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Ready to transform your JSON workflow?**

[**Install Now**](https://marketplace.visualstudio.com/items?itemName=davidnussio.vscode-jq-playground) | [**View Examples**](https://davidnussio.github.io/vscode-jq-playground/) | [**Report Issues**](https://github.com/davidnussio/vscode-jq-playground/issues)

⭐ **Star us on GitHub** if this extension makes your life easier!

</div>
