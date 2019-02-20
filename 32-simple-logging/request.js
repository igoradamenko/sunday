const url = require('url');

module.exports = (req, res) => {
  const urlParsed = url.parse(req.url, true);

  console.log('Incoming request', req.method, req.url);

  if (urlParsed.pathname === '/echo' && urlParsed.query.message) {
    const message = urlParsed.query.message;

    console.log('Echo:', message);

    res.end(message);
    return;
  }

  console.log('Unknown URL');

  res.statusCode = 404;
  res.end('Not found');
};
