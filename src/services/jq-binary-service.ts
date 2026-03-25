import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { HttpClient } from "@effect/platform";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import {
  config,
  executeCommand,
  showErrorMessage,
  showInformationMessage,
  VsCodeContext,
} from "../adapters/vscode-adapter";
import { BINARIES, isSupportedPlatform } from "../domain/constants";
import {
  ChecksumMismatchError,
  DownloadError,
  JqBinaryNotFoundError,
  JqExecutionError,
  UnsupportedPlatformError,
} from "../domain/errors";
import type { JqBinaryPath, JqVersion } from "../domain/models";

const spawnEffect = (command: string, args: string[]) =>
  Effect.async<string, JqExecutionError>((resume, signal) => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const proc = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });

    if (proc.stdout) {
      proc.stdout.on("data", (data) => stdout.push(data.toString()));
    }
    if (proc.stderr) {
      proc.stderr.on("data", (data) => stderr.push(data.toString()));
    }

    // Fiber interruption → kill the child process
    signal.addEventListener("abort", () => {
      proc.kill("SIGTERM");
    });

    proc.on("error", (error) => {
      resume(
        Effect.fail(
          new JqExecutionError({
            message: error.message,
            command,
            args,
          })
        )
      );
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resume(Effect.succeed(stdout.join("").trim()));
      } else {
        resume(
          Effect.fail(
            new JqExecutionError({
              message: stderr.join("") || "Command failed",
              command,
              args,
            })
          )
        );
      }
    });
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

// --- Download & checksum helpers ---

const sha256 = (data: Uint8Array): string =>
  createHash("sha256").update(data).digest("hex");

const downloadBinary = (
  url: string,
  expectedChecksum: string,
  destPath: string
) =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    yield* Effect.log(`Downloading jq from ${url}...`);

    const response = yield* client
      .get(url)
      .pipe(
        Effect.mapError(
          (e) => new DownloadError({ message: `HTTP request failed: ${e}` })
        )
      );

    const body = yield* response.arrayBuffer.pipe(
      Effect.mapError(
        (e) => new DownloadError({ message: `Failed to read response: ${e}` })
      )
    );

    const data = new Uint8Array(body);
    const actualChecksum = sha256(data);

    if (actualChecksum !== expectedChecksum) {
      return yield* new ChecksumMismatchError({
        expected: expectedChecksum,
        actual: actualChecksum,
        message: `SHA256 mismatch: expected ${expectedChecksum}, got ${actualChecksum}`,
      });
    }

    yield* Effect.try({
      try: () => {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.writeFileSync(destPath, data);
        if (process.platform !== "win32") {
          fs.chmodSync(destPath, 0o755);
        }
      },
      catch: (e) =>
        new DownloadError({ message: `Failed to write binary: ${e}` }),
    });

    yield* Effect.log(`jq binary saved to ${destPath}`);
    return destPath;
  });

const downloadJq = (updatePath: (value: string) => Effect.Effect<void>) =>
  Effect.gen(function* () {
    const platformInfo = yield* getPlatformInfo();
    const context = yield* VsCodeContext;
    const storagePath = context.globalStorageUri.fsPath;
    const binaryName = process.platform === "win32" ? "jq.exe" : "jq";
    const destPath = path.join(storagePath, binaryName);

    const savedPath = yield* downloadBinary(
      platformInfo.file,
      platformInfo.checksum,
      destPath
    );

    yield* updatePath(savedPath);
    yield* showInformationMessage(
      `jq binary downloaded and configured at ${savedPath}`,
      "Ok"
    );
  });

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
  const service = yield* JqBinaryService;
  yield* downloadJq(service.configRef.update).pipe(
    Effect.catchAll((e) =>
      showErrorMessage(`Failed to download jq: ${e.message}`, "Ok")
    )
  );
});

// --- Binary resolution helpers ---

const promptNoBinaryFound = (
  updatePath: (value: string) => Effect.Effect<void>
) =>
  Effect.gen(function* () {
    const choice = yield* showErrorMessage(
      "jq executable not found in your system PATH.",
      "Configure path manually",
      "Download automatically"
    );
    if (choice === "Configure path manually") {
      yield* openBinaryPathSettings();
    } else if (choice === "Download automatically") {
      yield* downloadJq(updatePath);
    }
  });

const promptBrokenBinary = (
  systemJqPath: string,
  updatePath: (value: string) => Effect.Effect<void>
) =>
  Effect.gen(function* () {
    const choice = yield* showErrorMessage(
      `jq found at ${systemJqPath} but it doesn't work correctly.`,
      "Configure path manually",
      "Download automatically"
    );
    if (choice === "Configure path manually") {
      yield* openBinaryPathSettings();
    } else if (choice === "Download automatically") {
      yield* downloadJq(updatePath);
    }
  });

const promptUseSystemBinary = (
  systemJqPath: string,
  systemVersion: JqVersion,
  updatePath: (value: string) => Effect.Effect<void>
) =>
  Effect.gen(function* () {
    const choice = yield* showInformationMessage(
      `Found system jq at ${systemJqPath} (${systemVersion}). Use it?`,
      "Yes, use system jq",
      "Configure manually",
      "Download latest"
    );
    if (choice === "Yes, use system jq") {
      yield* updatePath(systemJqPath);
      yield* Effect.log(`Using system jq: ${systemJqPath} (${systemVersion})`);
    } else if (choice === "Configure manually") {
      yield* openBinaryPathSettings();
    } else if (choice === "Download latest") {
      yield* downloadJq(updatePath);
    }
  });

const resolveJqBinary = (jqBinaryPathRef: {
  update: (value: string) => Effect.Effect<void>;
}) =>
  Effect.gen(function* () {
    const systemJqPath = yield* findInstalledJqPath().pipe(
      Effect.catchAll(() => Effect.succeed(null as string | null))
    );

    if (!systemJqPath) {
      yield* promptNoBinaryFound(jqBinaryPathRef.update);
      return;
    }

    const systemVersion = yield* jqVersion(systemJqPath).pipe(
      Effect.catchAll(() => Effect.succeed(null as JqVersion | null))
    );

    if (!systemVersion) {
      yield* promptBrokenBinary(systemJqPath, jqBinaryPathRef.update);
      return;
    }

    yield* promptUseSystemBinary(
      systemJqPath,
      systemVersion,
      jqBinaryPathRef.update
    );
  });

export class JqBinaryService extends Effect.Service<JqBinaryService>()(
  "@jqpg/JqBinaryService",
  {
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
        yield* resolveJqBinary(jqBinaryPathRef);
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
