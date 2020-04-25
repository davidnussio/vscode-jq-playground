import {
  bufferToString,
  bufferToJSON,
  parseCommandArgs,
  spawnCommand,
} from '../command-line'

import { fetchContent } from '../fetch-document'
import { Rejected } from 'crocks/Async'

describe('Spawn jq command line', () => {
  test('extract jq command options and filter', () => {
    expect(parseCommandArgs('--arg data value .data')).toEqual([
      '--arg',
      'data',
      'value',
      '.data',
    ])
    expect(parseCommandArgs('--arg data value .data | .[]')).toEqual([
      '--arg',
      'data',
      'value',
      '.data | .[]',
    ])
    expect(
      parseCommandArgs(
        '[.[] | {message: .commit.message, name: .commit.committer.name, parents: [.parents[].html_url]}]',
      ),
    ).toEqual([
      '[.[] | {message: .commit.message, name: .commit.committer.name, parents: [.parents[].html_url]}]',
    ])
    expect(parseCommandArgs('. / ", "')).toEqual(['. / ", "'])
    expect(parseCommandArgs('--arg var "val 212" .value = $var')).toEqual([
      '--arg',
      'var',
      'val 212',
      '.value = $var',
    ])

    expect(parseCommandArgs('-a . | .[]')).toEqual(['-a', '. | .[]'])
    expect(parseCommandArgs('-a -e . | .[]')).toEqual(['-a', '-e', '. | .[]'])

    expect(parseCommandArgs('--only-for-plugin-test-purpose')).toEqual([
      '--only-for-plugin-test-purpose',
      '',
    ])

    expect(parseCommandArgs('--only-for-plugin-test-purpose . | .[]')).toEqual([
      '--only-for-plugin-test-purpose',
      '. | .[]',
    ])

    expect(
      parseCommandArgs('-M --only-for-plugin-test-purpose . | .[]'),
    ).toEqual(['-M', '--only-for-plugin-test-purpose', '. | .[]'])

    expect(parseCommandArgs("--arg var val '.value = $var'")).toEqual([
      '--arg',
      'var',
      'val',
      "'.value = $var'",
    ])
  })

  test('should execute command', (done) => {
    const jqCommand = spawnCommand('/usr/bin/jq')

    const renderError = (data) => {
      done(bufferToString(data))
    }
    const expectJson = (expected) => (data) => {
      expect(bufferToJSON(data)).toEqual(expected)
      done()
    }
    const expectText = (expected) => (data) => {
      expect(bufferToString(data)).toEqual(expected)
      done()
    }

    jqCommand(
      parseCommandArgs('. / ", "'),
      { env: __dirname },
      '"a, b,c,d, e"',
    ).fork(renderError, expectJson(['a', 'b,c,d', 'e']))

    jqCommand(
      parseCommandArgs('--arg var "val 212" .value = $var'),
      { env: __dirname },
      '{}',
    ).fork(renderError, expectJson({ value: 'val 212' }))

    jqCommand(
      parseCommandArgs('--arg var val .value = $var'),
      { env: __dirname },
      '{}',
    ).fork(renderError, expectJson({ value: 'val' }))

    jqCommand(
      parseCommandArgs('{"k": {"a": 1, "b": 2}} * {"k": {"a": 0,"c": 3}}'),
      { env: __dirname },
      'null',
    ).fork(renderError, expectJson({ k: { a: 0, b: 2, c: 3 } }))

    jqCommand(
      parseCommandArgs('.[] | (1 / .)?'),
      { env: __dirname },
      '[1,0,-1]',
    ).fork(renderError, expectText('1\n-1\n'))

    jqCommand(
      parseCommandArgs('--compact-output .[] | (1 / .)?'),
      { env: __dirname },
      '[1,0,-1]',
    ).fork(renderError, expectText('1\n-1\n'))

    jqCommand(
      parseCommandArgs('[getpath(["a","b"], ["a","c"])]'),
      { env: __dirname },
      '{"a":{"b":0, "c":1}}',
    ).fork(renderError, expectJson([0, 1]))

    jqCommand(
      parseCommandArgs('with_entries(.key |= "KEY_" + .)'),
      { env: __dirname },
      '{"a": 1, "b": 2}',
    ).fork(
      renderError,
      expectJson({
        KEY_a: 1,
        KEY_b: 2,
      }),
    )
  })
})
