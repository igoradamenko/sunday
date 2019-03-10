// слишком простой чат, в коде есть минимум 7 серьёзных ошибок.
// что это за ошибки?

const http = require('http');
const fs = require('fs');

let clients = [];

http.createServer((req, res) => {
  switch (req.method + ' ' + req.url) {
    case 'GET /':
      fs.createReadStream(`${__dirname}/index.html`).pipe(res);
      break;

    case 'GET /subscribe':
      console.log('subscribe');
      clients.push(res);
      break;

    case 'POST /publish':
      let body = '';

      req
        .on('data', data => {
          body += data;
        })
        .on('end', () => {
          body = JSON.parse(body);

          console.log(`publish ${body.message}`);
          clients.forEach(res => {
            res.end(body.message);
          });

          clients = [];

          res.end('ok');
        });

      break;
  
    default:
      res.statusCode = 404;
      res.end('Not found');
  }


}).listen(3000);
