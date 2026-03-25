import * as path from "node:path";

export type SupportedPlatform = "darwin" | "linux" | "win32";

export const BINARIES: Record<
  SupportedPlatform,
  Record<string, { file: string; checksum: string }>
> = {
  darwin: {
    amd64: {
      file: "https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-macos-amd64",
      checksum:
        "e80dbe0d2a2597e3c11c404f03337b981d74b4a8504b70586c354b7697a7c27f",
    },
    arm64: {
      file: "https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-macos-arm64",
      checksum:
        "a9fe3ea2f86dfc72f6728417521ec9067b343277152b114f4e98d8cb0e263603",
    },
  },
  linux: {
    amd64: {
      file: "https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-linux-amd64",
      checksum:
        "020468de7539ce70ef1bceaf7cde2e8c4f2ca6c3afb84642aabc5c97d9fc2a0d",
    },
    arm64: {
      file: "https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-linux-arm64",
      checksum:
        "6bc62f25981328edd3cfcfe6fe51b073f2d7e7710d7ef7fcdac28d4e384fc3d4",
    },
  },
  win32: {
    amd64: {
      file: "https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-windows-amd64.exe",
      checksum:
        "23cb60a1354eed6bcc8d9b9735e8c7b388cd1fdcb75726b93bc299ef22dd9334",
    },
  },
};

export const JQ_QUERY_REGEX = /^jq\s/;

export const EXAMPLES_PATH = path.join(".", "examples");

export const LANGUAGES = ["jqpg", "jq"] as const;

export const isSupportedPlatform = (p: string): p is SupportedPlatform =>
  p === "darwin" || p === "linux" || p === "win32";
