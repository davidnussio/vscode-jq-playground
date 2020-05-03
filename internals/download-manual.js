const fs = require('fs')
const got = require('got')

got
  .get(
    'https://raw.githubusercontent.com/stedolan/jq/master/docs/content/manual/manual.yml',
  )
  .then(({ body }) => {
    fs.writeFileSync('./files/manual.yml', body)
  })
