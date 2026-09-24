import { execSync } from "node:child_process";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, test, vi } from "vitest";
import type { JqBinaryPath } from "../domain/models";
import { JqBinaryService } from "../services/jq-binary-service";
import {
  expectsJsonInput,
  JqExecutionService,
} from "../services/jq-execution-service";

// The binary service transitively imports the VS Code API, which is unavailable here.
vi.mock("vscode", () => ({}));

const RAW_TEXT_INPUT = "'foo'\n'bar'\n'baz'\n";

const hasSystemJq = (() => {
  try {
    execSync("jq --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

const SystemJqBinary = Layer.succeed(
  JqBinaryService,
  JqBinaryService.make({
    find: () => Effect.succeed("jq" as JqBinaryPath),
  } as unknown as JqBinaryService)
);

const runJq = (args: string[], input: string) =>
  Effect.gen(function* () {
    const jq = yield* JqExecutionService;
    return yield* jq.execute(args, input, { cwd: process.cwd() });
  }).pipe(
    Effect.provide(JqExecutionService.Default),
    Effect.provide(SystemJqBinary),
    Effect.either,
    Effect.runPromise
  );

describe("expectsJsonInput", () => {
  test("expects JSON input by default", () => {
    expect(expectsJsonInput([".foo"])).toBe(true);
    expect(expectsJsonInput(["--arg", "x", "1", "."])).toBe(true);
  });

  test("does not expect JSON with raw or null input", () => {
    expect(expectsJsonInput(["-R", "."])).toBe(false);
    expect(expectsJsonInput(["--raw-input", "."])).toBe(false);
    expect(expectsJsonInput(["-n", "."])).toBe(false);
    expect(expectsJsonInput(["--null-input", "."])).toBe(false);
  });
});

describe.runIf(hasSystemJq)("JqExecutionService with raw input", () => {
  test("passes non-JSON text to jq when -R is set", async () => {
    const result = await runJq(["-R", "{text: .}"], RAW_TEXT_INPUT);
    expect(result._tag).toBe("Right");
    const output = result._tag === "Right" ? result.right : "";
    expect(output.trim().split("\n").join("")).toBe(
      '{  "text": "\'foo\'"}{  "text": "\'bar\'"}{  "text": "\'baz\'"}'
    );
  });

  test("still rejects non-JSON text without -R", async () => {
    const result = await runJq(["."], RAW_TEXT_INPUT);
    expect(result._tag).toBe("Left");
    expect(result._tag === "Left" && result.left._tag).toBe(
      "InvalidJsonInputError"
    );
  });
});
