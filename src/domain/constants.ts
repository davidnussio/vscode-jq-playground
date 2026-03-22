import * as path from "node:path";

export type SupportedPlatform = "darwin" | "linux" | "win32";

export const BINARIES: Record<
  SupportedPlatform,
  Record<string, { file: string; checksum: string }>
> = {
  darwin: {
    amd64: {
      file: "https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-macos-amd64",
      checksum: "d91812b3fbcc20ae2e1f28a9b8141c67",
    },
    arm64: {
      file: "https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-macos-arm64",
      checksum: "d1e04871ef93ffd2807a00d7edfa305b",
    },
  },
  linux: {
    amd64: {
      file: "https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-linux-amd64",
      checksum: "b3cb933bb73f2a2c7fefb362cc8eabfd",
    },
    arm64: {
      file: "https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-linux-arm64",
      checksum: "50c61a2c9130a1e42de431f87490b210",
    },
  },
  win32: {
    amd64: {
      file: "https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-windows-amd64.exe",
      checksum: "88f32aca9fc04d009f3883844fab482e",
    },
  },
};

export const JQ_QUERY_REGEX = /^jq\s/;

export const EXAMPLES_PATH = path.join(".", "examples");

export const LANGUAGES = ["jqpg", "jq"] as const;

export const isSupportedPlatform = (p: string): p is SupportedPlatform =>
  p === "darwin" || p === "linux" || p === "win32";
