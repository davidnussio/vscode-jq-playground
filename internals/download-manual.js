const fs = require('fs')
const fetch = require('node-fetch')

fetch(
  'https://raw.githubusercontent.com/stedolan/jq/master/docs/content/manual/manual.yml',
)
  .then((res) => res.text())
  .then((text) => {
    fs.writeFileSync('./files/manual.yml', text)
  })
