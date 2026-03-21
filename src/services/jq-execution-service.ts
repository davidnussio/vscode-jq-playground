import { type CommonSpawnOptions, spawn } from "node:child_process";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import { InvalidJsonInputError, JqExecutionError } from "../domain/errors";
import { JqBinaryService } from "./jq-binary-service";

const spawnJq = (
  command: string,
  args: string[],
  options: CommonSpawnOptions,
  timeout: Duration.Duration
) =>
  Effect.fn("JqExecutionService.spawnJq")(function* (input?: string) {
    return yield* Effect.async<
      string,
      JqExecutionError | InvalidJsonInputError
    >((resume) => {
      const result = { stdout: [] as string[], stderr: [] as string[] };
      options.stdio = [input ? "pipe" : "ignore", "pipe", "pipe"];

      const proc = spawn(command, args, options);

      if (input) {
        try {
          JSON.parse(input);
        } catch (error) {
          resume(
            Effect.fail(
              new InvalidJsonInputError({
                message: `Invalid JSON input: ${error}`,
              })
            )
          );
          return;
        }
        if (proc.stdin) {
          proc.stdin.on("error", () => {
            // Intentionally ignored — stdin errors are non-fatal
          });
          proc.stdin.write(input);
          proc.stdin.end();
        }
      }

      if (proc.stdout) {
        proc.stdout.on("data", (data) => result.stdout.push(data));
      }
      if (proc.stderr) {
        proc.stderr.on("data", (data) => result.stderr.push(data));
      }

      const commandTimeout = setTimeout(() => {
        proc.kill("SIGABRT");
        result.stderr.push(
          `Command aborted: ${Duration.format(timeout)} timeout reached!`
        );
      }, Duration.toMillis(timeout));

      proc.on("error", (error) => {
        clearTimeout(commandTimeout);
        resume(
          Effect.fail(
            new JqExecutionError({
              message:
                "code" in error && error.code === "ENOENT"
                  ? `jq command not found at: ${command}`
                  : error.message,
              command,
              args,
            })
          )
        );
      });

      proc.on("close", (code) => {
        clearTimeout(commandTimeout);
        if (code === 0) {
          resume(Effect.succeed(result.stdout.join("")));
        } else {
          resume(
            Effect.fail(
              new JqExecutionError({
                message: result.stderr.join(""),
                command,
                args,
              })
            )
          );
        }
      });
    });
  });

export class JqExecutionService extends Effect.Service<JqExecutionService>()(
  "@jqpg/JqExecutionService",
  {
    effect: Effect.gen(function* () {
      const binary = yield* JqBinaryService;

      const execute = Effect.fn("JqExecutionService.execute")(function* (
        args: string[],
        input: string | undefined,
        options: { cwd: string; timeout?: Duration.Duration }
      ) {
        const jqPath = yield* binary.find();
        const timeout = options.timeout ?? Duration.seconds(10);
        return yield* spawnJq(
          jqPath,
          args,
          { cwd: options.cwd },
          timeout
        )(input);
      });

      return { execute };
    }),
  }
) {}
