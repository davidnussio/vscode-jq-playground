import * as path from "node:path";

export type SupportedPlatform = "darwin" | "linux" | "win32";

export const BINARIES: Record<
  SupportedPlatform,
  Record<string, { file: string; checksum: string }>
> = {
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

export const JQ_QUERY_REGEX = /^(jq)\s+(.+?)/;

export const CODELENS_TITLE_CONSOLE = /^darwin/.test(process.platform)
  ? "⚡ console (cmd+enter)"
  : "⚡ console (ctrl+enter)";

export const CODELENS_TITLE_EDITOR = "⚡ editor (shift+enter)";

export const EXAMPLES_PATH = path.join(".", "examples");

export const LANGUAGES = ["jqpg", "jq"] as const;

export const isSupportedPlatform = (p: string): p is SupportedPlatform =>
  p === "darwin" || p === "linux" || p === "win32";
