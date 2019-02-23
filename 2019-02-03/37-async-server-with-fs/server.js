const http = require('http');
const fs = require('fs');

http.createServer((req, res) => {
  if (req.url === '/') {
    fs.readFile('index.html', { encoding: 'utf-8' }, (err, info) => {
      res.end(info);
    });
  } else if (req.url === '/now') {
    res.end(new Date().toString());
  }
}).listen(3000);
