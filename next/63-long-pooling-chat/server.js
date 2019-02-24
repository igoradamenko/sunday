const http = require('http');
const fs = require('fs');
const url = require('url');

const chat = require('./chat');

http.createServer((req, res) => {
  const urlParsed = url.parse(req.url);

  switch (urlParsed.pathname) {
    case '/':
      sendFile(__dirname + '/index.html', res);
      break;

    case '/subscribe':
      chat.subscribe(req, res);
      break;

    case '/publish':
      let body = '';

      function readData(data) {
        body += data;

        if (body.length > 1000) {
          req.removeListener('data', readData);
          req.removeListener('end', publishData);
          res.statusCode = 413;
          res.end('Too long');
        }
      }

      function publishData() {
        try {
          body = JSON.parse(body);
        } catch(e) {
          res.statusCode = 400;
          res.end('Bad Request');
          console.error(e);
          return;
        }
        chat.publish(body.message);
        res.end();
      }

      req
        .on('data', readData)
        .on('end', publishData);
      break;

    default:
      res.statusCode = 404;
      res.end('Not Found');
  }
}).listen(3000);

function sendFile(file, res) {
  const fileStream = fs.createReadStream(file);

  fileStream
    .on('error', () => {
      res.statusCode = 500;
      res.end('Something went wrong');
    })
    .pipe(res)
    .on('close', () => {
      fileStream.destroy();
    })
}
