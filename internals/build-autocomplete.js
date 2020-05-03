const fs = require('fs')
const util = require('util')
const YAML = require('yaml')
const { identity } = require('crocks')
const json = require('../files/builtins.json')

const readFileAsync = util.promisify(fs.readFile)
const writeFileAsync = util.promisify(fs.writeFile)

const processMatches = (matches, title, body, examples = []) => {
  return matches.reduce((acc, m) => {
    const key = m.replace(/^`|`$/g, '').replace(/\(.*/, '')
    if (json[key]) {
      return {
        ...acc,
        [key]: {
          documentation: `## ${title}\n${body}\n${examples.reduce(
            (acc, e) =>
              acc.concat(
                '- `jq ' +
                  e.program +
                  '`\nInput: `' +
                  e.input +
                  '`\nOutput: `' +
                  e.output +
                  '`\n\n',
              ),
            '',
          )}`,
        },
      }
    }
    return acc
  }, {})
}

const processTitle = ({ title, body, examples }) => {
  const matches = title.match(/`([a-z0-9_\\(\\)]+)*`/g)
  const result =
    matches && matches.length
      ? processMatches(matches, title, body, examples)
      : false
  return Object.keys(result).length ? result : false
}

function processSectionEntries(section) {
  if (
    Object.prototype.hasOwnProperty.call(section, 'entries') &&
    section.entries
  ) {
    return processSectionEntries(section.entries)
  }
  return section.length ? section.flatMap(processTitle) : false
}

readFileAsync('./files/manual.yml')
  .then((data) =>
    YAML.parse(data.toString())
      .sections.flatMap(processSectionEntries)
      .filter(identity)
      .reduce((acc, curr) => ({ ...acc, ...curr }), {}),
  )
  .then((data) =>
    writeFileAsync('./src/builtins.json', JSON.stringify(data, null, 2)),
  )
  .then(() => console.log('Done!'))
  .catch((err) => console.log('Error:', err))
