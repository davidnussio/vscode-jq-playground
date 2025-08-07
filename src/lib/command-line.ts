import { type CommonSpawnOptions, spawn } from "node:child_process";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
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

const arrayToPair = (xs: string[]): [string[], string[]] => [[], xs];

const optionsMap = (key: string) =>
  isJqOptionKey(key) ? jqCommandOptions[key] : undefined;

const howManyValueForOption = (key: string): number | false => {
  const val = optionsMap(key);
  return typeof val === "number" ? val : false;
};

// Remove redundant quantifiers and clarify regex precedence
const trimOption = String.replace(/^(?:['"]|['"]$)/g, "");

const optionAndValues = (acc: [string[], string[]]): [string[], string[]] => {
  const howMany = howManyValueForOption(acc[1][0]);
  if (howMany === false) {
    return acc;
  }
  return [
    acc[0].concat(acc[1].slice(0, howMany + 1).map(trimOption)),
    acc[1].slice(howMany + 1),
  ];
};

const extractOptionsAndFilter = (
  xs: [string[], string[]]
): [string[], string[]] => {
  let acc: [string[], string[]] = xs;
  while (acc[1].length > 0) {
    const next = optionAndValues(acc);
    if (next === acc) {
      break;
    }
    acc = next;
  }
  return acc;
};

const pairToCommandArgs = (pair: [string[], string[]]): string[] => {
  return pair[0].concat(pair[1].join(" "));
};

export const parseCommandArgs = (str: string): string[] => {
  // Regex complexity warning: this is a legacy pattern, but kept for compatibility
  const matchArr = str.match(
    /(--?\w+(?:-\w+)*|"(?:\\"|[^"])+"|(:?\s?[^\s]+\s?))/g
  );
  return matchArr ? matchArr.map(String.trim) : [];
};

export const parseJqCommandArgs = (str: string): string[] => {
  const arr = parseCommandArgs(str);
  const pair = arrayToPair(arr);
  const filtered = extractOptionsAndFilter(pair);
  return pairToCommandArgs(filtered);
};

export const bufferToString = (buffer: Buffer): string => buffer.toString();

export const bufferToJSON = (buffer: Buffer) =>
  JSON.parse(bufferToString(buffer));

export const spawnCommandEffect =
  (
    command: string,
    args: string[],
    options: CommonSpawnOptions,
    timeout = Duration.seconds(10)
  ) =>
  (input?: string) =>
    Effect.async<string, string>((resume) => {
      const result = { stdout: [], stderr: [] } as {
        stdout: string[];
        stderr: string[];
      };

      options.stdio = [input ? "pipe" : "ignore", "pipe", "pipe"];

      const proc = spawn(command, args, options);

      const rejErr = (err?: unknown) => {
        result.stderr.push("🔥 JQ query:\n\n");
        result.stderr.push(`${args.join(" ")}\n\n`);
        result.stderr.push("🔥 Error:\n\n");
        if (err) {
          result.stderr.push(err.toString());
        }
      };

      if (input) {
        try {
          JSON.parse(input);
        } catch (error) {
          resume(Effect.fail(`Invalid JSON input: ${error}`));
          return;
        }
        if (proc.stdin) {
          proc.stdin.on("error", rejErr);
          proc.stdin.write(input);
          proc.stdin.end();
        }
      }

      if (proc.stdout) {
        proc.stdout.on("error", rejErr);
        proc.stdout.on("data", (data) => {
          result.stdout.push(data);
        });
      }
      if (proc.stderr) {
        proc.stderr.on("error", rejErr);
        proc.stderr.on("data", (data) => {
          result.stderr.push(data);
        });
      }
      const commandTimeout = setTimeout(() => {
        proc.kill("SIGABRT");
        result.stderr.push(
          `Command aborted: ${Duration.format(timeout)} timeout reached!`
        );
      }, Duration.toMillis(timeout));

      proc.on("error", (error) => {
        if ("code" in error && error.code === "ENOENT") {
          resume(
            Effect.fail(`The specified command could not be found.
            Please ensure the command is installed and in your system's PATH:
            ${command}
          `)
          );
        } else {
          // Handle other potential errors, like permission issues.
          resume(Effect.fail(`An error occurred: ${error.message}`));
        }
      });

      proc.on("close", (code) => {
        clearTimeout(commandTimeout);
        if (code === 0) {
          resume(Effect.succeed(result.stdout.join("")));
        } else {
          resume(Effect.fail(result.stderr.join("")));
        }
      });
    });
