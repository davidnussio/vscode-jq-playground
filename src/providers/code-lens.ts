import { Array, Option, pipe } from "effect";
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

const findAllMatches = (document: TextDocument): Array<JqMatch> =>
  pipe(
    Array.range(0, document.lineCount - 1),
    Array.map((documentLine: number) => {
      const line = document.lineAt(documentLine);
      const text = line.text.substring(0, 30);
      return JQ_QUERY_REGEX.test(text)
        ? Option.some(jqMatchRange(document, documentLine))
        : Option.none();
    }),
    Array.getSomes
  );

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
