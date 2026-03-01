import { spawnSync } from 'node:child_process';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import {
  config,
  executeCommand,
  showErrorMessage,
  showInformationMessage,
} from './adapters/vscode-adapter';

type SupportedPlatform = 'darwin' | 'linux' | 'win32';

export const binaries: Record<
  SupportedPlatform,
  Record<string, { file: string; checksum: string }>
> = {
  darwin: {
    amd64: {
      file: 'https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-macos-amd64',
      checksum: 'ed17e93cb3ef1be977fd7283ea605d2d',
    },
    arm64x: {
      file: 'https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-macos-arm64',
      checksum: '4ee0157ad6740efc58162a8266ca3091',
    },
  },
  linux: {
    amd64: {
      file: 'https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-linux-amd64',
      checksum: '07c6205219634c82bae369de89efe175',
    },
  },
  win32: {
    amd64: {
      file: 'https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-windows-amd64.exe',
      checksum: 'fc682c40ed883241b34662713a9b8ff6',
    },
  },
} as const;

class PlatformBinary extends Data.TaggedClass('PlatformBinary')<{
  isSupported: boolean;
  platform: string;
  arch: string;
  message: string;
  file?: string;
  checksum?: string;
}> {}

const isSupportedPlatform = (platform: string): platform is SupportedPlatform =>
  platform === 'darwin' || platform === 'linux' || platform === 'win32';

const getPlatformBinary = (platform: string, arch: string) => {
  if (!isSupportedPlatform(platform)) {
    return new PlatformBinary({
      isSupported: false,
      platform,
      arch,
      message: `Unsupported platform: ${platform}`,
    });
  }
  const platformBinaries = binaries[platform];
  if (!platformBinaries[arch]) {
    return new PlatformBinary({
      isSupported: false,
      platform,
      arch,
      message: `Unsupported architecture ${arch} for platform ${platform}`,
    });
  }
  const platformBinary = platformBinaries[arch];
  return new PlatformBinary({
    isSupported: true,
    platform,
    arch,
    file: platformBinary.file,
    checksum: platformBinary.checksum,
    message: `(${platform}/${arch}): ${platformBinary.file} (${platformBinary.checksum})`,
  });
};

class CommandError extends Data.TaggedError('CommandError')<{
  command: string;
  args: string[];
  message: string;
}> {}

const spawnEffect = (command: string, args: string[]) => {
  return Effect.try(() => spawnSync(command, args)).pipe(
    Effect.flatMap((result) =>
      result?.status === 0
        ? Effect.succeed(result.stdout.toString().trim())
        : Effect.fail(
            new CommandError({
              command,
              args,
              message: result?.error
                ? result?.error?.message
                : 'Command failed with code',
            })
          )
    )
  );
};
const findInstalledJqPath = () => spawnEffect('which', ['jq']);

const jqVersion = (path: string) => spawnEffect(path, ['--version']);

export const jqPathSetting = () =>
  executeCommand('workbench.action.openSettings', 'jqPlayground.binaryPath');
export class ExtensionConfig extends Effect.Service<ExtensionConfig>()(
  'ExtensionConfigService',
  {
    scoped: Effect.gen(function* () {
      yield* Effect.log('Initializing ExtensionConfigService...');
      const jqBinaryPathRef = yield* config<string>(
        'jqPlayground',
        'binaryPath',
        true
      );

      if (Option.isNone(yield* jqBinaryPathRef.get)) {
        const installedPath = yield* findInstalledJqPath().pipe(
          Effect.catchAll(() => Effect.succeed(null))
        );
        yield* Effect.log(
          `No jq binary path configured, found jq at: ${installedPath}`
        );
        // Update the config
        if (installedPath) {
          // TODO: Store autoconfigurate path in the config
          yield* jqBinaryPathRef.update(installedPath);
          const answer = yield* showInformationMessage(
            `- Automatically configured jq binary path: ${installedPath}`,
            'Ok',
            'Cancel'
          );
          yield* Effect.log(
            `Automatically configured jq binary path: ${answer} / ${installedPath}`
          );
        } else {
          const platformBinary = getPlatformBinary(
            process.platform,
            process.arch
          );
          const value = yield* showErrorMessage(
            `jq executable not found! Please configure the jq executable path in the settings, or download the jq binary from the official repository for your architecture. ${platformBinary.message}`,
            'Download',
            'Configure'
          );
          if (value === 'Download') {
            yield* Effect.log(
              `Downloading jq binary from: ${platformBinary.file}`
            );
          }
          if (value === 'Configure') {
            yield* jqPathSetting();
          }
        }
      }

      const path = yield* jqBinaryPathRef.get;
      yield* Effect.log(
        `Using jq binary at: ${Option.getOrElse(path, () => '')}`
      );

      const version = jqVersion(Option.getOrElse(path, () => ''));
      if (yield* Effect.isFailure(version)) {
        const result = yield* showErrorMessage(
          `Failed to get jq version from path: ${Option.getOrElse(
            path,
            () => ''
          )}. Please check the jq binary path in the settings.`,
          'Open Settings'
        );
        if (result === 'Open Settings') {
          yield* jqPathSetting();
        }
        Effect.catchAll(() => Effect.succeed(Option.none()));
      }

      return {
        binaries,
        jq: {
          path: jqBinaryPathRef.get,
          version: yield* Effect.option(version),
        },
      };
    }),
  }
) {}
