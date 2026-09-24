import { defineConfig } from "vitest/config";

// Only the unit tests: src/test/*.test.ts runs inside VS Code via vscode-test
// and imports the "vscode" module, which is unavailable to Vitest.
export default defineConfig({
  test: {
    include: ["src/__tests__/**/*.test.ts"],
  },
});
