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
  file.on('error', err => {
    res.statusCode = 500;
    res.end('Server Error');
    console.error(err);
  });

  file
    .on('open', () => console.log('open'))
    .on('close', () => console.log('close'));
}
