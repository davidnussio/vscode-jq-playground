import { Array, pipe } from "effect";
import { CodeLens, Range, type TextDocument } from "vscode";
import { isAiEnabled } from "../ai/ai-service";
import { JQ_QUERY_REGEX } from "../domain/constants";

const JQ_PREFIX_REGEX = /^jq\s+/;

export interface JqMatch {
  readonly document: TextDocument;
  readonly openResult: "output" | "editor";
  readonly range: Range;
}

const jqMatchRange = (document: TextDocument, line: number): JqMatch => ({
  document,
  range: new Range(line, 0, line, 30),
  openResult: "output",
});

const findAllMatches = (document: TextDocument): Array<JqMatch> => {
  const matches: Array<JqMatch> = [];
  for (let i = 0; i < document.lineCount; i++) {
    const text = document.lineAt(i).text.slice(0, 30);
    if (JQ_QUERY_REGEX.test(text)) {
      matches.push(jqMatchRange(document, i));
    }
  }
  return matches;
};

const makeCodeLens = (
  match: JqMatch,
  index: number,
  openResult: "output" | "editor"
): CodeLens =>
  new CodeLens(match.range, {
    title: openResult === "output" ? "⚡ console" : "⚡ editor",
    command: "extension.executeJqCommand",
    arguments: [{ ...match, index, openResult }],
  });

const extractFilter = (document: TextDocument, line: number): string => {
  const text = document.lineAt(line).text;
  return text.replace(JQ_PREFIX_REGEX, "").trim();
};

const extractInputSample = (
  document: TextDocument,
  line: number
): string | undefined => {
  const inputStart = line + 1;
  if (inputStart >= document.lineCount) {
    return undefined;
  }
  const lines: string[] = [];
  for (
    let i = inputStart;
    i < document.lineCount && !JQ_QUERY_REGEX.test(document.lineAt(i).text);
    i++
  ) {
    lines.push(document.lineAt(i).text);
  }
  const sample = lines.join("\n").slice(0, 500);
  return sample || undefined;
};

const makeExplainCodeLens = (match: JqMatch): CodeLens => {
  const filter = extractFilter(match.document, match.range.start.line);
  const input = extractInputSample(match.document, match.range.start.line);
  return new CodeLens(match.range, {
    title: "✨ Explain",
    command: "jqpg.ai.explainFilter",
    arguments: [filter, input],
  });
};

export const jqQueryLenses = (document: TextDocument): CodeLens[] =>
  pipe(
    findAllMatches(document),
    Array.flatMap((match, index) => {
      const lenses = [
        makeCodeLens(match, index, "output"),
        makeCodeLens(match, index, "editor"),
      ];
      if (isAiEnabled()) {
        lenses.push(makeExplainCodeLens(match));
      }
      return lenses;
    })
  );
