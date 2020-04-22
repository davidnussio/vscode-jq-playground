import eyes from 'eyes'

const styles = Object.assign({}, eyes.defaults.styles, {
  all: 'grey',
  string: 'red',
  label: 'yellow',
  key: 'cyan',
  bool: 'green',
  regexp: 'magenta',
  special: 'green',
})

const isNil = x => x === undefined || x === null

const when = (pred, f) => x => (pred(x) ? f(x) : x)

const hasInspect = x => !isNil(x) && typeof x.inspect === 'function'

const inspect = when(hasInspect, x => x.inspect())

const write = eyes.inspector({ styles })

export function log(...args: ReadonlyArray<any>) {
  if (!args.length) {
    write(undefined)
    return undefined
  } else if (args.length > 1) {
    write(inspect(args[1]), args[0])
    return args[1]
  }

  write(inspect(args[0]))
  return args[0]
}

export const trace = (label: string) => (value: any) => {
  log(label, value)
  return value
}
