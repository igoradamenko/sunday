const http = require('http');
const url = require('url');

const server = new http.Server((req, res) => {
  console.log(req.headers);

  res.writeHead(200, {'csrf': '1'});

  // const urlParsed = url.parse(req.url, true);
  // console.log(urlParsed);
  //
  // if (urlParsed.pathname === '/echo' && urlParsed.query.message) {
  //   res.end(urlParsed.query.message);
  // } else {
  //   res.statusCode = 404;
  //   res.end('Not found');
  // }
});

server.listen(1337, '127.0.0.1');
