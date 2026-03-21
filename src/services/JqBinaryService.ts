import { spawnSync } from 'node:child_process';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import {
  config,
  executeCommand,
  showErrorMessage,
  showInformationMessage,
} from '../adapters/vscode-adapter';
import {
  BINARIES,
  isSupportedPlatform,
} from '../domain/constants';
import {
  JqBinaryNotFoundError,
  JqExecutionError,
  UnsupportedPlatformError,
} from '../domain/errors';
import type { JqBinaryPath, JqVersion } from '../domain/models';

const spawnEffect = (command: string, args: string[]) =>
  Effect.try({
    try: () => {
      const result = spawnSync(command, args);
      if (result?.status === 0) {
        return result.stdout.toString().trim();
      }
      throw new Error(result?.error?.message ?? 'Command failed');
    },
    catch: (e) =>
      new JqExecutionError({
        message: e instanceof Error ? e.message : String(e),
        command,
        args,
      }),
  });

const findInstalledJqPath = () =>
  spawnEffect('which', ['jq']).pipe(
    Effect.mapError(
      () => new JqBinaryNotFoundError({ message: 'jq not found in PATH' })
    )
  );

const jqVersion = (path: string) =>
  spawnEffect(path, ['--version']).pipe(
    Effect.map((v) => v as JqVersion)
  );

const openBinaryPathSettings = () =>
  executeCommand('workbench.action.openSettings', 'jqPlayground.binaryPath');

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

export class JqBinaryService extends Effect.Service<JqBinaryService>()(
  '@jqpg/JqBinaryService',
  {
    scoped: Effect.gen(function* () {
      yield* Effect.log('Initializing JqBinaryService...');

      const jqBinaryPathRef = yield* config<string>(
        'jqPlayground',
        'binaryPath',
        true
      );

      const currentPath = yield* jqBinaryPathRef.get;

      if (Option.isNone(currentPath)) {
        const installedPath = yield* findInstalledJqPath().pipe(
          Effect.catchAll(() => Effect.succeed(null as string | null))
        );

        if (installedPath) {
          yield* jqBinaryPathRef.update(installedPath);
          yield* showInformationMessage(
            `Automatically configured jq binary path: ${installedPath}`,
            'Ok'
          );
          yield* Effect.log(`Auto-configured jq path: ${installedPath}`);
        } else {
          const platformInfo = yield* Effect.catchAll(
            getPlatformInfo(),
            () => Effect.succeed(null as { platform: string; arch: string; file: string; checksum: string } | null)
          );
          const platformMsg = platformInfo
            ? `(${platformInfo.platform}/${platformInfo.arch}): ${platformInfo.file}`
            : '';

          const choice = yield* showErrorMessage(
            `jq executable not found! Configure the path in settings or download it. ${platformMsg}`,
            'Download',
            'Configure'
          );

          if (choice === 'Configure') {
            yield* openBinaryPathSettings();
          }
          if (choice === 'Download' && platformInfo) {
            yield* Effect.log(`Download requested: ${platformInfo.file}`);
          }
        }
      }

      const resolvedPath = yield* jqBinaryPathRef.get;

      const find = Effect.fn('JqBinaryService.find')(function* () {
        const p = yield* jqBinaryPathRef.get;
        if (Option.isNone(p) || p.value === '') {
          return yield* new JqBinaryNotFoundError({
            message: 'No jq binary path configured',
          });
        }
        return p.value as JqBinaryPath;
      });

      const version = Effect.fn('JqBinaryService.version')(function* () {
        const p = yield* find();
        return yield* jqVersion(p);
      });

      const validate = Effect.fn('JqBinaryService.validate')(function* () {
        const p = yield* find();
        const v = yield* version();
        return { path: p, version: v };
      });

      // Validate on startup if path is set
      if (Option.isSome(resolvedPath) && resolvedPath.value !== '') {
        const validation = yield* validate().pipe(
          Effect.catchAll((e) => {
            return showErrorMessage(
              `Failed to validate jq at: ${Option.getOrElse(resolvedPath, () => '')}. ${e.message}`,
              'Open Settings'
            ).pipe(
              Effect.tap((choice) =>
                choice === 'Open Settings'
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
