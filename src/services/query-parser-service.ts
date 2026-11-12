import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type { TextDocument } from "vscode";
import { JQ_PREFIX_REGEX, JQ_QUERY_REGEX } from "../domain/constants";
import { JqParseError } from "../domain/errors";
import {
  ConsoleOutput,
  EditorOutput,
  FileAppendOutput,
  FileOutput,
  type OutputTarget,
  type ParsedQuery,
} from "../domain/models";
import { parseJqCommandArgs } from "../lib/command-line";

// --- Multiline query extraction ---

const UNESCAPED_QUOTE_END_REGEX = /(?:^|[^\\])'\s*$/;
const SINGLE_QUOTE_WHITESPACE_REGEX = /^'\s*$/;
const TRAILING_WHITESPACE_REGEX = /\s*$/;

const hasClosingQuote = (query: string): boolean => {
  // Check if the string (after the opening quote) contains an unescaped closing quote.
  // We skip the first character which is the opening quote itself.
  const afterOpening = query.slice(1);
  return (
    UNESCAPED_QUOTE_END_REGEX.test(afterOpening) ||
    SINGLE_QUOTE_WHITESPACE_REGEX.test(afterOpening)
  );
};

const extractMultilineQuery = (
  document: TextDocument,
  startLine: number,
  initial: string
): { query: string; lineOffset: number } => {
  let query = initial;
  let lineOffset = 1;
  for (
    let line = startLine + lineOffset;
    !hasClosingQuote(query) && line < document.lineCount;
    line++
  ) {
    query += `\n${document.lineAt(line).text}`;
    lineOffset++;
  }
  // Remove opening and closing quotes
  return {
    query: query.slice(1, -1).replace(TRAILING_WHITESPACE_REGEX, ""),
    lineOffset,
  };
};

// --- Output redirect parsing ---

const parseOutputRedirect = (
  document: TextDocument,
  contextLine: number
): { target: OutputTarget | null; nextLine: number; lineOffset: number } => {
  const text = document.lineAt(contextLine)?.text ?? "";

  if (text.startsWith(">> ")) {
    const path = text.replace(">> ", "").trim();
    return {
      target: FileAppendOutput(path),
      nextLine: contextLine + 1,
      lineOffset: 1,
    };
  }
  if (text.startsWith("> ")) {
    const path = text.replace("> ", "").trim();
    return {
      target: FileOutput(path),
      nextLine: contextLine + 1,
      lineOffset: 1,
    };
  }
  return { target: null, nextLine: contextLine, lineOffset: 0 };
};

// --- Read editor variables (VAR=value lines before jq) ---

export const readEditorVariables = (
  document: TextDocument
): Map<string, string> => {
  const variables = new Map<string, string>();
  for (let i = 0; i < document.lineCount; i++) {
    const lineText = document.lineAt(i).text.trim();
    if (JQ_QUERY_REGEX.test(lineText)) {
      break;
    }
    if (lineText.startsWith("#")) {
      continue;
    }
    const eqIndex = lineText.indexOf("=");
    if (eqIndex > 0) {
      variables.set(
        lineText.slice(0, eqIndex).trim(),
        lineText.slice(eqIndex + 1).trim()
      );
    }
  }
  return variables;
};

export class QueryParserService extends Context.Service<QueryParserService>()(
  "@jqpg/QueryParserService",
  {
    make: Effect.sync(() => {
      const parse = Effect.fn("QueryParserService.parse")(function* (
        document: TextDocument,
        lineIndex: number,
        defaultOutput: "output" | "editor"
      ) {
        if (lineIndex < 0 || lineIndex >= document.lineCount) {
          return yield* new JqParseError({
            message: `Line ${lineIndex} out of range`,
          });
        }

        const rawLine = document.lineAt(lineIndex).text.trimStart();
        if (!JQ_QUERY_REGEX.test(rawLine)) {
          return yield* new JqParseError({
            message: `Line does not start with jq: "${rawLine}"`,
          });
        }

        const queryLine = rawLine.replace(JQ_PREFIX_REGEX, "");
        const args = parseJqCommandArgs(queryLine);
        let filter = args.at(-1) ?? "";
        let lineOffset = 1;

        // Handle multiline filter (wrapped in single quotes)
        if (filter.startsWith("'")) {
          const res = extractMultilineQuery(document, lineIndex, filter);
          filter = res.query;
          args[args.length - 1] = filter;
          lineOffset += res.lineOffset - 1;
        }

        // Parse output redirect
        let contextLine = Math.min(
          lineIndex + lineOffset,
          document.lineCount - 1
        );
        let outputTarget: OutputTarget =
          defaultOutput === "editor" ? EditorOutput : ConsoleOutput;

        const redirect = parseOutputRedirect(document, contextLine);
        if (redirect.target) {
          outputTarget = redirect.target;
          contextLine = redirect.nextLine;
          lineOffset += redirect.lineOffset;
        }

        return {
          args,
          filter,
          outputTarget,
          inputLineIndex: contextLine,
        } satisfies ParsedQuery;
      });

      return { parse };
    }),
  }
) {
  static readonly layer = Layer.effect(this, this.make);
}
