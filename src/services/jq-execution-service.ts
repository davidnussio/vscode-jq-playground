import { type CommonSpawnOptions, spawn } from "node:child_process";
import * as Context from "effect/Context";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { JqExecutionError } from "../domain/errors";
import { JqBinaryService } from "./jq-binary-service";

const spawnJq = (
  command: string,
  args: string[],
  options: CommonSpawnOptions,
  timeout: Duration.Duration
) =>
  Effect.fn("JqExecutionService.spawnJq")((input?: string) =>
    Effect.callback<string, JqExecutionError>((resume, signal) => {
      const result = { stdout: [] as string[], stderr: [] as string[] };
      options.stdio = [input ? "pipe" : "ignore", "pipe", "pipe"];

      const proc = spawn(command, args, options);

      if (input && proc.stdin) {
        proc.stdin.on("error", () => {
          // Intentionally ignored — stdin errors are non-fatal
        });
        proc.stdin.write(input);
        proc.stdin.end();
      }

      // Decode as a stream so multi-byte characters split across chunks
      // are not corrupted.
      proc.stdout?.setEncoding("utf8");
      proc.stderr?.setEncoding("utf8");
      proc.stdout?.on("data", (data: string) => result.stdout.push(data));
      proc.stderr?.on("data", (data: string) => result.stderr.push(data));

      const commandTimeout = setTimeout(() => {
        proc.kill("SIGKILL");
        resume(
          Effect.fail(
            new JqExecutionError({
              message: `Command aborted: ${Duration.format(timeout)} timeout reached!`,
              command,
              args,
            })
          )
        );
      }, Duration.toMillis(timeout));

      // Fiber interruption → kill the child process
      signal.addEventListener("abort", () => {
        clearTimeout(commandTimeout);
        proc.kill("SIGTERM");
      });

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
    })
  );

export class JqExecutionService extends Context.Service<JqExecutionService>()(
  "@jqpg/JqExecutionService",
  {
    make: Effect.gen(function* () {
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
) {
  static readonly layer = Layer.effect(this, this.make);
}
