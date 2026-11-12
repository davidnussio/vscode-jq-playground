import * as Schema from "effect/Schema";

// --- Branded types ---

export const JqBinaryPath = Schema.String.pipe(Schema.brand("JqBinaryPath"));
export type JqBinaryPath = typeof JqBinaryPath.Type;

export const JqVersion = Schema.String.pipe(Schema.brand("JqVersion"));
export type JqVersion = typeof JqVersion.Type;

// --- Output target ---

export type OutputTarget =
  | { readonly _tag: "ConsoleOutput" }
  | { readonly _tag: "EditorOutput" }
  | { readonly _tag: "FileOutput"; readonly path: string }
  | { readonly _tag: "FileAppendOutput"; readonly path: string };

export const ConsoleOutput: OutputTarget = { _tag: "ConsoleOutput" };
export const EditorOutput: OutputTarget = { _tag: "EditorOutput" };
export const FileOutput = (path: string): OutputTarget => ({
  _tag: "FileOutput",
  path,
});
export const FileAppendOutput = (path: string): OutputTarget => ({
  _tag: "FileAppendOutput",
  path,
});

// --- Parsed query ---

export interface ParsedQuery {
  readonly args: string[];
  readonly filter: string;
  readonly inputLineIndex: number;
  readonly outputTarget: OutputTarget;
}
