const http = require('http');
const fs = require('fs');

new http.Server((req, res) => {
  if (req.url === '/big.html') {
    const file = new fs.ReadStream(__dirname + '/../53-readable-stream-example-big/big.html');
    sendFile(file, res);
  }
}).listen(3000);

function sendFile(file, res) {
  file.on('readable', write);

  function write() {
    const fileContent = file.read();

    if (fileContent && !res.write(fileContent)) {
      file.removeListener('readable', write);

      res.once('drain', () => {
        file.on('readable', write);
        write();
      });
    }
  }
}
