import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "out/test/**/*.test.js",
  workspaceFolder: ".",
  mocha: {
    timeout: 120_000,
  },
});
