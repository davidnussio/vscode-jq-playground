# Change Log

## [5.0.7]

### Fixed

- Sidebar activity bar icon missing from published extension (`.vscodeignore` excluded the entire `images/` folder)

## [5.0.6]

### Added

- New sidebar Playground Panel with dedicated activity bar icon (`JQPG: Open Playground Panel`)
  - Filter textarea with jq builtins autocomplete (keyboard navigation)
  - File picker: select JSON files from open editors or workspace (max 4, shown as chips)
  - Cmd/Ctrl+Enter shortcut to run filters
  - Panel state (filter, selected files) persists across tab switches via `vscode.getState()`
- Standalone panel variant via command palette (`JQPG: Open Playground Panel`)
- Architecture documentation: Excalidraw diagram and Mermaid diagrams (`architecture.md`)

### Fixed

- Activation race condition: `activate()` now returns a `Promise` so VS Code waits for all commands to be registered before resolving

### Changed

- Removed redundant `onLanguage:jqpg` from `activationEvents` (auto-inferred from `contributes`)

## [5.0.5]

- Update package.json metadata and description

## [5.0.4]

- Fix: support again jqplay.org integration
- Add `Open in jqplay.org` command
- Add unit tests for command-line argument parsing

## [5.0.3]

- Fix: downgrade vscode engine version to maintain compatibility with open-vsx

## [5.0.2]

- Update jq syntax highlighting for improved keyword and punctuation recognition
- Add configurable progress notification delay for jq execution
- Add progress notification with cancellation support for jq execution and shell commands
- Add download and checksum validation for jq binaries
- Enhance vscode adapter with new document handling functions
- Refactor AI enabled check to use configuration adapter
- Add integration tests for jq playground functionality

## [5.0.1]

- Add AI-powered features: Explain, Fix, and Generate jq filters (requires GitHub Copilot)
- Update jq binaries to version 1.8.1 for macOS, Linux, and Windows
- Improve error rendering in executeJqCommand

## [5.0.0]

- Complete rewrite using Effect-TS service layer architecture
- Migrate from webpack to esbuild
- Migrate from npm to pnpm
- Migrate from eslint to biome (ultracite)
- New modular service architecture: JqExecutionService, InputResolverService, QueryParserService, OutputRendererService, JqBinaryService
- New VS Code adapter layer for testable, composable API wrappers
- Add shortcut labels for console and editor code lenses
- Require vscode ^1.100.0

## [4.3.5]

- Support languageId in result view

## [4.3.4]

- Bugfix release

## [4.3.3]

- Fix: close issue #87

## [4.3.2]

- Fix: removed command and invert label mac/others

## [4.3.1]

- Show cmd+enter shortcut on macOS

## [4.3.0]

- Adds append to redirect output (leonelgalan)
- fix execute command

## [4.2.0]

- Log debug to OUTPUT jqpg debug console

## [4.1.0]

- Filter json with input box on the fly
- Filter json with input box on the fly and add filter to playground
- Miror fix jq filter autocomplete

## [4.0.1]

- Support multi input files #49

## [4.0.0]

- Redirect output to file
- Support command line variables
- Input variable

## [3.3.0]

- Use common command line as jq's input (support basic commands: http|curl|wget|cat|echo|ls|dir|grep|tail|head|find)
- Update dependencies

## [3.2.5]

- show jq errors instead "Error: write EPIPE"

## [3.2.4]

- Open editor output with languageId json close #53

## [3.2.3]

- Fix missing option -c fix #52

## [3.2.2]

- Fix working with windows paths
- Update deps

## [3.2.1]

- Minor fix

## [3.2.0]

- Support multiline jq filter
- Enhanced autocomple with official documentazion and examples
- Improve (ctrl+enter) and (shift+enter) keyboard shortcut
- Better code highlight with jq-syntax-highlighting integration
- Support new extension file .jqpg (**jq** **p**lay**g**round) to avoid .jq script conflicts

## [3.1.3]

- Binary path configuration key

## [3.1.2]

- Fix empty dir

## [3.1.1]

- Fix hashcode
- ctrl+enter (execute filter) works on all lines of the document
- Multiline filter works like teminal with quotes 'filter...'

## [3.1.0]

- Code autocomple with official documentaion
- Optimized extension vsix package size from 2MB to 74KB
- Small fix to code highlight

## [3.0.0]

- Support multiline query
- Full support for jq command line options
- Support custom binary installation
- Use workspace file as command input or query filter

## [2.1.1]

- Support relative module paths

## [2.1.0]

- Added autocomplete jq operators and functions
- Support jq command line options #22
- Enhanced input data parser

## [2.0.1]

- Some small improvements

## [2.0.0]

- Update jq binary from version 1.5 to 1.6
- With the new → ctrl+shift+p → _jq playground: Examples_ command, the extension will open a notebook with executable examples [JQ Manual](https://stedolan.github.io/jq/manual/)

## [1.3.0]

- Bugfixes

## [0.6.0]

- Support hotkeys: ctrl+enter → to output, shift+enter → to editor

## [0.5.0]

- Try to support JSON Object with non string keys.

## [0.3.0]

- New commands under _jq playground_ group. There are commands to open online manual, tutorial and execute query for active text editor on [jqplay.org](https://jqplay.org/)

## [0.2.0]

- Possibility to use workspace files, saved or not with autocomplete filename, support plaintext and json types

## [0.1.0]

- Fix minor bug

## [0.0.1]

- Initial release
