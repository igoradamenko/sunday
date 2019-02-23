const http = require('http');
const fs = require('fs');

http.createServer((req, res) => {
  let info;

  if (req.url === '/') {
    info = fs.readFileSync('index.html', { encoding: 'utf-8' });
    res.end(info);
  } else if (req.url === '/now') {
    res.end(new Date().toString());
  }
}).listen(3000);
