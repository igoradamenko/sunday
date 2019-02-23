const http = require('http');
const fs = require('fs');

// high memory consumption way
new http.Server((req, res) => {
  if (req.url === '/big.html') {
    fs.readFile(__dirname + '/../53-readable-stream-example-big/big.html', { encoding: 'utf-8' }, (err, content) => {
      if (err) {
        res.statusCode = 500;
        res.end('Server error');
      } else {
        res.setHeader('content-type', 'text/html; charset=utf-8');
        res.end(content);
      }
    });
  }
}).listen(3000);

// low memory consumption way
// new http.Server((req, res) => {
//   if (req.url === '/big.html') {
//     const file = new fs.ReadStream(__dirname + '/../53-readable-stream-example-big/big.html');
//     sendFile(file, res);
//   }
// }).listen(3000);
//
// function sendFile(file, res) {
//   file.on('readable', write);
//
//   function write() {
//     const fileContent = file.read();
//     if (fileContent) {
//       res.write(fileContent);
//     } else {
//       res.end();
//     }
//   }
// }
