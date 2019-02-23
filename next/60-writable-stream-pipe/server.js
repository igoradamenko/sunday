const http = require('http');
const fs = require('fs');

new http.Server((req, res) => {
  if (req.url === '/big.html') {
    const file = new fs.ReadStream(__dirname + '/../53-readable-stream-example-big/big.html');
    sendFile(file, res);
  }
}).listen(3000);

function sendFile(file, res) {
  file.pipe(res);
}
