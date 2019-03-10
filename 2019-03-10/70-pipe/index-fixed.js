const fs = require('fs');

const fileIn = fs.createReadStream(__filename + '1123123');
const fileOut = fs.createWriteStream(`${__filename}.out`);

fileIn.pipe(fileOut);

fileIn.on('error', cleanup);
fileOut.on('error', cleanup);

function cleanup() {
  fs.unlink(__filename, err => {
    if (err) throw err;
  });

  fileIn.destroy();
  fileOut.destroy();
}
