const fs = require('fs')
const YAML = require('yaml')
const { compose, curry, identity } = require('crocks')

const prepareExample = (data) => {
  return `jq ${data.program}
${data.input}
# ${data.output}


`
}

const print = curry((print, data) => {
  if (print) {
    console.log(data)
  }
  return data
})

const writeFile = curry((path, data) => {
  fs.writeFileSync(path, data)
  return data
})

function processSectionEntries(section) {
  if (
    Object.prototype.hasOwnProperty.call(section, 'entries') &&
    section.entries
  ) {
    return processSectionEntries(section.entries)
  }
  return section.length
    ? section.flatMap(({ example = [], examples = [] }) => [
        ...example,
        ...examples,
      ])
    : []
}

const writeExamples = compose(
  writeFile('./examples/manual.jq'),
  print(process.env.DEBUG),
)

const data = fs.readFileSync('./files/manual.yml')
writeExamples(
  YAML.parse(data.toString())
    .sections.flatMap(processSectionEntries)
    .filter(identity)
    .reduce((acc, example) => acc.concat(prepareExample(example)), ''),
)
