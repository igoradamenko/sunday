const http = require('http');
const fs = require('fs');

new http.Server((req, res) => {
  if (req.url === '/big.html') {
    const file = new fs.ReadStream(__dirname + '/../53-readable-stream-example-big/big.html');
    sendFile(file, res);
  }
}).listen(3000);

function sendFile(file, res) {
  file.on('data', write);
  file.on('end', () => res.end());

  function write(data) {
    if (data && !res.write(data)) {
      file.removeListener('data', write);
      res.once('drain', () => file.on('data', write));
    }
  }
}
