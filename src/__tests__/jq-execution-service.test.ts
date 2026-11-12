import { execSync } from "node:child_process";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, test, vi } from "vitest";
import type { JqBinaryPath } from "../domain/models";
import { JqBinaryService } from "../services/jq-binary-service";
import { JqExecutionService } from "../services/jq-execution-service";

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
  JqBinaryService.of({
    find: () => Effect.succeed("jq" as JqBinaryPath),
  } as unknown as typeof JqBinaryService.Service)
);

const runJq = (args: string[], input: string) =>
  Effect.gen(function* () {
    const jq = yield* JqExecutionService;
    return yield* jq.execute(args, input, { cwd: process.cwd() });
  }).pipe(
    Effect.provide(JqExecutionService.layer),
    Effect.provide(SystemJqBinary),
    Effect.result,
    Effect.runPromise
  );

describe.runIf(hasSystemJq)("JqExecutionService input handling", () => {
  test("passes non-JSON text to jq when -R is set", async () => {
    const result = await runJq(["-R", "{text: .}"], RAW_TEXT_INPUT);
    expect(result._tag).toBe("Success");
    const output = result._tag === "Success" ? result.success : "";
    expect(output.trim().split("\n").join("")).toBe(
      '{  "text": "\'foo\'"}{  "text": "\'bar\'"}{  "text": "\'baz\'"}'
    );
  });

  test("still rejects non-JSON text without -R", async () => {
    const result = await runJq(["."], RAW_TEXT_INPUT);
    expect(result._tag).toBe("Failure");
    expect(result._tag === "Failure" && result.failure._tag).toBe(
      "JqExecutionError"
    );
  });

  test("accepts a stream of several JSON documents", async () => {
    const result = await runJq(["-c", ".a"], '{"a":1}\n{"a":2}\n');
    expect(result._tag === "Success" && result.success).toBe("1\n2\n");
  });

  test("keeps multi-byte characters intact in large outputs", async () => {
    const text = "è€😀".repeat(40_000);
    const result = await runJq(["-r", "."], JSON.stringify(text));
    expect(result._tag === "Success" && result.success).toBe(`${text}\n`);
  });
});
