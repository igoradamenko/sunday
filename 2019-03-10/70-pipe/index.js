const fs = require('fs');

const fileIn = fs.createReadStream(__filename);
const fileOut = fs.createWriteStream(`${__filename}.out`);

fileIn.pipe(fileOut);
