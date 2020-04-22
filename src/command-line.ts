import { spawn } from 'child_process'

import { join, match, replace, trim } from 'ramda'
import {
  Async,
  bimap,
  compose,
  curry,
  identity,
  isNumber,
  map,
  merge,
  option,
  Pair,
  reduce,
  safeAfter,
} from 'crocks'

// const jqCommandOptions :: { option: String, optionValue: Number }
export const jqCommandOptions = Object.freeze({
  '--version': 0,
  '--seq': 0,
  '--stream': 0,
  '--slurp': 0,
  '-s': 0,
  '--raw-input': 0,
  '-R': 0,
  '--null-input': 0,
  '-n': 0,
  '--compact-output': 0,
  '--tab': 0,
  '--indent': 1,
  '--color-output': 0,
  '-C': 0,
  '--monochrome-output': 0,
  '-M': 0,
  '--ascii-output': 0,
  '-a': 0,
  '--unbuffered': 0,
  '--sort-keys': 0,
  '-S': 0,
  '--raw-output': 0,
  '-r': 0,
  '--join-output': 0,
  '-j': 0,
  '-f': 1,
  '--from-file': 1,
  '-L': 1,
  '-e': 0,
  '--exit-status': 0,
  '--arg': 2,
  '--argjson': 2,
  '--slurpfile': 2,
  '--rawfile': 2,
  '--argfile': 2,
  '--args': 0,
  '--jsonargs': 0,
  '--run-tests': 1,
  '--': 0,
  '--only-for-plugin-test-purpose': 0,
})

// arrayToPair :: a -> Pair ([], a)
const arrayToPair = xs => Pair([], xs)

// optionMap :: { option: String, optionValue: Number }
const optionsMap = key => jqCommandOptions[key]

// howManyValueForOption :: String -> Number + Boolean
const howManyValueForOption = compose(
  option(false),
  safeAfter(isNumber, optionsMap),
)

// optionAndValues :: Pair ([String] [String]) -> Pair ([String] [String])
const optionAndValues = acc => {
  const howMany = howManyValueForOption(acc.snd().slice(0, 1))

  return howMany === false
    ? acc
    : Pair(
        acc.fst().concat(
          acc
            .snd()
            .slice(0, howMany + 1)
            .map(trimOption),
        ),
        acc.snd().slice(howMany + 1),
      )
}

// extractOptionsAndFilter :: Pair ([] [String]) -> Pair([ String ] [ String ])
const extractOptionsAndFilter = xs => reduce(optionAndValues, xs, xs.snd())

// trimParts :: [String] -> [String]
const trimOption = replace(/^['"]{1}|['"]{1}$/g, '')

// pairToCommandArgs :: Pair ([String], [String]) -> [String]
const pairToCommandArgs = compose(
  merge((x, y) => x.concat([y])),
  bimap(identity, compose(join(' '))),
)

// parseCommandArgs :: String -> Pair ([String], [String])
export const parseCommandArgs = compose(
  pairToCommandArgs,
  extractOptionsAndFilter,
  arrayToPair,
  map(trim),
  match(/(--?\w+(?:-\w+)*|"(?:\\"|[^"])+"|(:?\s?[^\s]+\s?))/g),
)

// bufferToString :: Buffer -> String
export const bufferToString = buffer => buffer.toString()

// bufferToJSON :: Buffer -> JSON
export const bufferToJSON = compose(JSON.parse, bufferToString)

// spawnCommand :: ??????
export const spawnCommand = curry((command: string, args, options, input) =>
  Async((rej, res) => {
    const result = { stdout: [], stderr: [] }

    const proc = spawn(command, args, options)

    proc.on('error', rej)
    proc.stdin.on('error', rej)
    proc.stdout.on('error', rej)
    proc.stderr.on('error', rej)

    proc.stdin.write(input)
    proc.stdin.end()

    proc.stdout.on('data', data => {
      result.stdout.push(data)
    })

    proc.stderr.on('data', data => {
      result.stderr.push(data)
    })

    proc.on('close', code => {
      code === 0 ? res(result.stdout) : rej(result.stderr)
    })
  }),
)
