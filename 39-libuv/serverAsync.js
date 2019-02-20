const http = require('http');
const fs = require('fs');

http.createServer((req, res) => {
  if (req.url === '/') {
    fs.readFile('index.html', { encoding: 'utf-8' }, (err, info) => {
      if (err) {
        console.error(err);
        res.statusCode = 500;
        res.end('There is an error on the server side');
        return;
      }

      res.end(info);
    });
  } else { /* 404 */ }
}).listen(3000);
