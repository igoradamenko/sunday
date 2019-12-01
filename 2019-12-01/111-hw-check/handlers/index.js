const path = require('path');
const fs = require('fs');

const indexFile = __filename.split('/').pop();

const handlers = fs.readdirSync(path.join(__dirname))
  .sort()
  .filter(x => x !== indexFile);

module.exports = app => handlers.forEach(x => require(`./${x}`)(app));
