import { Array, Option, pipe } from "effect";

import { CodeLens, Range, type TextDocument } from "vscode";
import { CONFIGS } from "./config/configs";
import { type RenderOutputType } from "./utils/renderers";

export interface JqMatch {
  readonly document: TextDocument;
  readonly range: Range;
  openResult: RenderOutputType;
}

const JQ_QUERY_REGEX = /^(jq)\s+(.+?)/;

const RESULT_OUTPUT = {
  CONSOLE: "RESULT_OUTPUT_CONSOLE",
  EDITOR: "RESULT_OUTPUT_EDITOR",
};

function jqMatchRange(document: TextDocument, line: number): JqMatch {
  return {
    document,
    range: new Range(line, 0, line, 30),
    openResult: "output",
  };
}

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
  openResult: RenderOutputType
): CodeLens => {
  return new CodeLens(match.range, {
    title:
      openResult === "output"
        ? CONFIGS.EXECUTE_JQ_COMMAND_CONSOLE_TITLE
        : CONFIGS.EXECUTE_JQ_COMMAND_EDITOR_TITLE,
    command: "extension.executeJqCommand",
    arguments: [{ ...match, index, openResult }],
  });
};

export const jqQueryLenses = (document: TextDocument): CodeLens[] =>
  pipe(
    findAllMatches(document),
    Array.flatMap((match, index) => {
      return [
        makeCodeLens(match, index, "output"),
        makeCodeLens(match, index, "editor"),
      ];
    })
  );
