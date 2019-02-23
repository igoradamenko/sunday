const http = require('http');
const fs = require('fs');

http.createServer((req, res) => {
  let info;

  if (req.url === '/') {
    try {
      info = fs.readFileSync('index.html', { encoding: 'utf-8' })
    } catch (err) {
      console.error(err);
      res.statusCode = 500;
      res.end('There is an error on the server side');
      return;
    }

    res.end(info);
  } else { /* 404 */ }
}).listen(3000);
