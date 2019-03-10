const fs = require('fs');

const fileIn = fs.createReadStream(__filename);
const fileOut = fs.createWriteStream(`${__filename}.out`);

fileIn.on('data', data => {
  fileOut.write(data);
});

fileIn.on('close', () => {
  fileOut.close();
});

//fileIn.pipe(fileOut);
