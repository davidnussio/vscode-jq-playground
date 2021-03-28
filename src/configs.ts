'use strict';

import * as path from 'path';

export const BINARIES = {
  darwin: {
    file: 'https://github.com/stedolan/jq/releases/download/jq-1.6/jq-osx-amd64',
    checksum: 'c15f86ad9298ee71cf7d96a29f86e88a',
  },
  linux: {
    file: 'https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64',
    checksum: '1fffde9f3c7944f063265e9a5e67ae4f',
  },
  win32: {
    file: 'https://github.com/stedolan/jq/releases/download/jq-1.6/jq-win64.exe',
    checksum: 'af2b0264f264dde1fe705ca243886fb2',
  },
};
export const CONFIGS = {
  FILEPATH: undefined,
  FILENAME: /^win32/.test(process.platform) ? './jq.exe' : './jq',
  MANUAL_PATH: path.join('.', 'examples', 'manual.jqpg'),
  LANGUAGES: ['jqpg', 'jq'],
  EXECUTE_JQ_COMMAND: 'extension.executeJqCommand',
  CODE_LENS_TITLE: 'jq',
  JQ_PLAYGROUND_VERSION: 'vscode-jq-playground.version',
  SHOW_EXAMPLES: 'vscode-jq-payground.showExamples',
};
