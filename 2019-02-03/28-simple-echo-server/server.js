// http://127.0.0.1:1337/echo?message=Hello → Hello

const http = require('http');
const url = require('url');

const server = new http.Server((req, res) => {
  console.log(req.method, req.url);

  const urlParsed = url.parse(req.url, true);

  console.log(urlParsed);

  if (urlParsed.pathname === '/echo' && urlParsed.query.message) {
    res.end(urlParsed.query.message);
  } else {
    res.statusCode = 404;
    res.end('Not found');
  }
});

server.listen(1337);
