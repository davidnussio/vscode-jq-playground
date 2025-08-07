const fs = require("node:fs");

fetch(
  "https://raw.githubusercontent.com/jqlang/jq/11f43e9d93dec278bdd470bf25214cba614de2dc/docs/content/manual/dev/manual.yml"
)
  .then((res) => res.text())
  .then((text) => {
    fs.writeFileSync("./files/manual.yml", text);
  });
