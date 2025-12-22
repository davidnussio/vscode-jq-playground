import * as path from "path";

export const BINARIES = {
  darwin: {
    amd64: {
      file: "https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-macos-amd64",
      checksum: "ed17e93cb3ef1be977fd7283ea605d2d",
    },
    arm64: {
      file: "https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-macos-arm64",
      checksum: "4ee0157ad6740efc58162a8266ca3091",
    },
  },
  linux: {
    amd64: {
      file: "https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-linux-amd64",
      checksum: "07c6205219634c82bae369de89efe175",
    },
  },
  win32: {
    amd64: {
      file: "https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-windows-amd64.exe",
      checksum: "fc682c40ed883241b34662713a9b8ff6",
    },
  },
};

export const CONFIGS = {
  FILEPATH: "",
  FILENAME: /^win32/.test(process.platform) ? "./jq.exe" : "./jq",
  MANUAL_PATH: path.join(".", "examples", "manual.jqpg"),
  LANGUAGES: ["jqpg", "jq"],
  EXECUTE_JQ_COMMAND: "extension.executeJqCommand",
  EXECUTE_JQ_COMMAND_CONSOLE_TITLE: /^darwin/.test(process.platform)
    ? "⚡ console (cmd+enter)"
    : "⚡ console (ctrl+enter)",
  EXECUTE_JQ_COMMAND_EDITOR_TITLE: "⚡ editor (shift+enter)",
  CODE_LENS_TITLE: "jq",
  JQ_PLAYGROUND_VERSION: "vscode-jq-playground.version",
  SHOW_EXAMPLES: "vscode-jq-payground.showExamples",
  EXAMPLES_PATH: path.join(".", "examples"),
};
