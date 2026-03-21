import * as String from "effect/String";

export const jqCommandOptions = Object.freeze({
  "--version": 0,
  "--seq": 0,
  "--stream": 0,
  "--slurp": 0,
  "-s": 0,
  "--raw-input": 0,
  "-R": 0,
  "--null-input": 0,
  "-n": 0,
  "-c": 0,
  "--compact-output": 0,
  "--tab": 0,
  "--indent": 1,
  "--color-output": 0,
  "-C": 0,
  "--monochrome-output": 0,
  "-M": 0,
  "--ascii-output": 0,
  "-a": 0,
  "--unbuffered": 0,
  "--sort-keys": 0,
  "-S": 0,
  "--raw-output": 0,
  "-r": 0,
  "--join-output": 0,
  "-j": 0,
  "-f": 1,
  "--from-file": 1,
  "-L": 1,
  "-e": 0,
  "--exit-status": 0,
  "--arg": 2,
  "--argjson": 2,
  "--slurpfile": 2,
  "--rawfile": 2,
  "--argfile": 2,
  "--args": 0,
  "--jsonargs": 0,
  "--run-tests": 1,
  "--": 0,
  "--only-for-plugin-test-purpose": 0,
} as const);

type JqOptionKey = keyof typeof jqCommandOptions;

const isJqOptionKey = (key: string): key is JqOptionKey =>
  key in jqCommandOptions;

/** Parsed options and remaining filter tokens. */
interface OptionsPair {
  readonly options: string[];
  readonly remaining: string[];
}

const arrayToPair = (xs: string[]): OptionsPair => ({
  options: [],
  remaining: xs,
});

const optionsMap = (key: string) =>
  isJqOptionKey(key) ? jqCommandOptions[key] : undefined;

const howManyValueForOption = (key: string): number | false => {
  const val = optionsMap(key);
  return typeof val === "number" ? val : false;
};

// Remove redundant quantifiers and clarify regex precedence
const trimOption = String.replace(/^(?:['"]|['"]$)/g, "");

const optionAndValues = (acc: OptionsPair): OptionsPair => {
  const howMany = howManyValueForOption(acc.remaining[0]);
  if (howMany === false) {
    return acc;
  }
  return {
    options: acc.options.concat(
      acc.remaining.slice(0, howMany + 1).map(trimOption)
    ),
    remaining: acc.remaining.slice(howMany + 1),
  };
};

const extractOptionsAndFilter = (xs: OptionsPair): OptionsPair => {
  let acc = xs;
  while (acc.remaining.length > 0) {
    const next = optionAndValues(acc);
    if (next === acc) {
      break;
    }
    acc = next;
  }
  return acc;
};

const pairToCommandArgs = (pair: OptionsPair): string[] => {
  return pair.options.concat(pair.remaining.join(" "));
};

export const parseCommandArgs = (str: string): string[] => {
  const matchArr = str.match(
    /(--?\w+(?:-\w+)*|"(?:\\"|[^"])+"|(?:\s?[^\s]+\s?))/g
  );
  return matchArr ? matchArr.map(String.trim) : [];
};

export const parseJqCommandArgs = (str: string): string[] => {
  const arr = parseCommandArgs(str);
  const pair = arrayToPair(arr);
  const filtered = extractOptionsAndFilter(pair);
  return pairToCommandArgs(filtered);
};
