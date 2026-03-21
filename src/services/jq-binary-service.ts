import { spawnSync } from "node:child_process";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import {
  config,
  executeCommand,
  showErrorMessage,
  showInformationMessage,
} from "../adapters/vscode-adapter";
import { BINARIES, isSupportedPlatform } from "../domain/constants";
import {
  JqBinaryNotFoundError,
  JqExecutionError,
  UnsupportedPlatformError,
} from "../domain/errors";
import type { JqBinaryPath, JqVersion } from "../domain/models";

const spawnEffect = (command: string, args: string[]) =>
  Effect.try({
    try: () => {
      const result = spawnSync(command, args);
      if (result?.status === 0) {
        return result.stdout.toString().trim();
      }
      throw new Error(result?.error?.message ?? "Command failed");
    },
    catch: (e) =>
      new JqExecutionError({
        message: e instanceof Error ? e.message : String(e),
        command,
        args,
      }),
  });

const findInstalledJqPath = () =>
  spawnEffect("which", ["jq"]).pipe(
    Effect.mapError(
      () => new JqBinaryNotFoundError({ message: "jq not found in PATH" })
    )
  );

const jqVersion = (path: string) =>
  spawnEffect(path, ["--version"]).pipe(Effect.map((v) => v as JqVersion));

const openBinaryPathSettings = () =>
  executeCommand("workbench.action.openSettings", "jqPlayground.binaryPath");

const getPlatformInfo = () => {
  const platform = process.platform;
  const arch = process.arch;
  if (!isSupportedPlatform(platform)) {
    return Effect.fail(
      new UnsupportedPlatformError({
        platform,
        arch,
        message: `Unsupported platform: ${platform}`,
      })
    );
  }
  const archBinaries = BINARIES[platform];
  const binary = archBinaries[arch];
  if (!binary) {
    return Effect.fail(
      new UnsupportedPlatformError({
        platform,
        arch,
        message: `Unsupported architecture ${arch} for platform ${platform}`,
      })
    );
  }
  return Effect.succeed({ platform, arch, ...binary });
};

/**
 * Command handler: opens the jqPlayground.binaryPath setting for manual configuration.
 */
export const configureJqPathCommand = Effect.gen(function* () {
  yield* openBinaryPathSettings();
});

/**
 * Command handler: downloads the jq binary for the current platform.
 */
export const downloadJqBinaryCommand = Effect.gen(function* () {
  const platformInfo = yield* getPlatformInfo();
  yield* Effect.log(`Download requested: ${platformInfo.file}`);
  // TODO: implement actual download logic
  yield* showInformationMessage(
    `Download jq for ${platformInfo.platform}/${platformInfo.arch}: ${platformInfo.file}`,
    "Ok"
  );
});

export class JqBinaryService extends Effect.Service<JqBinaryService>()(
  "@jqpg/JqBinaryService",
  {
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: pre-existing complexity, refactor planned
    scoped: Effect.gen(function* () {
      yield* Effect.log("Initializing JqBinaryService...");

      const jqBinaryPathRef = yield* config<string>(
        "jqPlayground",
        "binaryPath",
        true
      );

      const currentPath = yield* jqBinaryPathRef.get;

      // Only run resolution if no path is configured
      if (Option.isNone(currentPath) || currentPath.value === "") {
        // 1. Check if jq is available in system PATH
        const systemJqPath = yield* findInstalledJqPath().pipe(
          Effect.catchAll(() => Effect.succeed(null as string | null))
        );

        if (systemJqPath) {
          // 2. Validate the system jq actually works
          const systemVersion = yield* jqVersion(systemJqPath).pipe(
            Effect.catchAll(() => Effect.succeed(null as JqVersion | null))
          );

          if (systemVersion) {
            // System jq is valid — ask user if they want to use it
            const choice = yield* showInformationMessage(
              `Found system jq at ${systemJqPath} (${systemVersion}). Use it?`,
              "Yes, use system jq",
              "Configure path manually",
              "Download latest"
            );

            if (choice === "Yes, use system jq") {
              yield* jqBinaryPathRef.update(systemJqPath);
              yield* Effect.log(
                `Using system jq: ${systemJqPath} (${systemVersion})`
              );
            } else if (choice === "Configure path manually") {
              yield* openBinaryPathSettings();
            } else if (choice === "Download latest") {
              yield* Effect.log("User chose to download jq");
              // TODO: actual download
            }
          } else {
            // System jq found but broken — prompt without system option
            const choice = yield* showErrorMessage(
              `jq found at ${systemJqPath} but it doesn't work correctly.`,
              "Configure path manually",
              "Download automatically"
            );
            if (choice === "Configure path manually") {
              yield* openBinaryPathSettings();
            } else if (choice === "Download automatically") {
              yield* Effect.log("User chose to download jq");
              // TODO: actual download
            }
          }
        } else {
          // 3. No system jq found at all
          const choice = yield* showErrorMessage(
            "jq executable not found in your system PATH.",
            "Configure path manually",
            "Download automatically"
          );
          if (choice === "Configure path manually") {
            yield* openBinaryPathSettings();
          } else if (choice === "Download automatically") {
            yield* Effect.log("User chose to download jq");
            // TODO: actual download
          }
        }
      }

      const resolvedPath = yield* jqBinaryPathRef.get;

      const find = Effect.fn("JqBinaryService.find")(function* () {
        const p = yield* jqBinaryPathRef.get;
        if (Option.isNone(p) || p.value === "") {
          return yield* new JqBinaryNotFoundError({
            message: "No jq binary path configured",
          });
        }
        return p.value as JqBinaryPath;
      });

      const version = Effect.fn("JqBinaryService.version")(function* () {
        const p = yield* find();
        return yield* jqVersion(p);
      });

      const validate = Effect.fn("JqBinaryService.validate")(function* () {
        const p = yield* find();
        const v = yield* version();
        return { path: p, version: v };
      });

      // Validate on startup if path is set
      if (Option.isSome(resolvedPath) && resolvedPath.value !== "") {
        const validation = yield* validate().pipe(
          Effect.catchAll((e) => {
            return showErrorMessage(
              `Failed to validate jq at: ${Option.getOrElse(resolvedPath, () => "")}. ${e.message}`,
              "Open Settings"
            ).pipe(
              Effect.tap((choice) =>
                choice === "Open Settings"
                  ? openBinaryPathSettings()
                  : Effect.void
              ),
              Effect.map(() => null)
            );
          })
        );
        if (validation) {
          yield* Effect.log(
            `JqBinaryService ready: ${validation.path} (${validation.version})`
          );
        }
      }

      return {
        find,
        version,
        validate,
        configRef: jqBinaryPathRef,
        openSettings: openBinaryPathSettings,
      };
    }),
  }
) {}
