const fs = require('fs');

const stream = fs.createReadStream(__filename);

console.log(stream);
