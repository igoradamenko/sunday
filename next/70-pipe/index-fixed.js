const fs = require('fs');

const fileIn = fs.createReadStream(__filename, {highWaterMark: 100});

const fileOut = fs.createWriteStream(__filename + ".out", {highWaterMark: 100});

fileIn.pipe(fileOut);

// Q: can I/O error happen before the handler is set?
fileIn.on('error', cleanup);
fileOut.on('error', cleanup);

function cleanup() {
  fs.unlink(fileOut.path, err => { // eslint-disable-line
    if (err.code == 'ENOENT') {
      /* it's ok if no such file, ignore the error */
    } else {
      throw err;
    }
  });

  // close both files (otherwise won't be closed! no close event!)
  fileIn.destroy();
  fileOut.destroy();
}
