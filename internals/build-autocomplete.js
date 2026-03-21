const fs = require("node:fs");
const util = require("node:util");
const YAML = require("yaml");
const { identity } = require("crocks");
const json = require("../files/builtins.json");

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

const BACKTICK_REGEX = /`/g;
const PAREN_REGEX = /\(.*/;

const processMatches = (title, body, examples = []) => {
  const result = {};
  for (const m of title.split(",")) {
    const key = m.replace(BACKTICK_REGEX, "").replace(PAREN_REGEX, "").trim();
    if (json[key]) {
      result[key] = {
        documentation: `## ${title}\n${body}\n${examples.reduce(
          (exAcc, e) =>
            exAcc.concat(
              `- \`jq ${e.program}\`\nInput: \`${e.input}\`\nOutput: \`${e.output}\`\n\n`
            ),
          ""
        )}`,
      };
    }
  }
  return result;
};

const processTitle = ({ title, body, examples }) => {
  const result = title.startsWith("`")
    ? processMatches(title, body, examples)
    : false;
  return Object.keys(result).length ? result : false;
};

function processSectionEntries(section) {
  if (Object.hasOwn(section, "entries") && section.entries) {
    return processSectionEntries(section.entries);
  }
  return section.length ? section.flatMap(processTitle) : false;
}

readFileAsync("./files/manual.yml")
  .then((data) => {
    const result = {};
    for (const curr of YAML.parse(data.toString())
      .sections.flatMap(processSectionEntries)
      .filter(identity)) {
      Object.assign(result, curr);
    }
    return result;
  })
  .then((data) =>
    writeFileAsync("./src/builtins.json", JSON.stringify(data, null, 2))
  )
  .then(() => console.log("Done!"))
  .catch((err) => console.log("Error:", err));
