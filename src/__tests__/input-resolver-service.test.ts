import { FetchHttpClient } from "@effect/platform";
import * as Effect from "effect/Effect";
import { describe, expect, test } from "vitest";
import type { TextDocument } from "vscode";
import { InputResolverService } from "../services/input-resolver-service";

const fakeDocument = (content: string): TextDocument => {
  const lines = content.split("\n");
  return {
    lineCount: lines.length,
    lineAt: (index: number) => ({ text: lines[index] }),
  } as unknown as TextDocument;
};

const resolveInline = (content: string, inputLineIndex: number) =>
  Effect.gen(function* () {
    const resolver = yield* InputResolverService;
    return yield* resolver.resolve(
      fakeDocument(content),
      inputLineIndex,
      process.cwd(),
      []
    );
  }).pipe(
    Effect.provide(InputResolverService.Default),
    Effect.provide(FetchHttpClient.layer),
    Effect.runPromise
  );

describe("InputResolverService inline input", () => {
  test("keeps every inline line on its own line", async () => {
    const input = await resolveInline("jq -R '.'\n'foo'\n'bar'\n'baz'", 1);
    expect(input).toBe("'foo'\n'bar'\n'baz'\n");
  });

  test("stops at the next query and drops separating blank lines", async () => {
    const content = "jq -R '.'\n'foo'\n'bar'\n\n\njq '.a'\n{\"a\": 1}\n";
    const input = await resolveInline(content, 1);
    expect(input).toBe("'foo'\n'bar'\n");
  });

  test("keeps multi-line JSON intact", async () => {
    const content = 'jq ".a"\n{\n  "a": 1\n}\n';
    const input = await resolveInline(content, 1);
    expect(JSON.parse(input)).toEqual({ a: 1 });
  });
});
