import { Array, pipe } from "effect";
import { CodeLens, Range, type TextDocument } from "vscode";
import {
  CODELENS_TITLE_CONSOLE,
  CODELENS_TITLE_EDITOR,
  JQ_QUERY_REGEX,
} from "../domain/constants";

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
    const text = document.lineAt(i).text.substring(0, 30);
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
    title:
      openResult === "output" ? CODELENS_TITLE_CONSOLE : CODELENS_TITLE_EDITOR,
    command: "extension.executeJqCommand",
    arguments: [{ ...match, index, openResult }],
  });

export const jqQueryLenses = (document: TextDocument): CodeLens[] =>
  pipe(
    findAllMatches(document),
    Array.flatMap((match, index) => [
      makeCodeLens(match, index, "output"),
      makeCodeLens(match, index, "editor"),
    ])
  );
