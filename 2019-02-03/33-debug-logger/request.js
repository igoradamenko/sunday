const url = require('url');
const debug = require('debug')('server:request');
const debugError = require('debug')('server:request:error');

module.exports = (req, res) => {
  const urlParsed = url.parse(req.url, true);

  debug('Incoming request', req.method, req.url);

  if (urlParsed.pathname === '/echo' && urlParsed.query.message) {
    const message = urlParsed.query.message;

    debug('Echo:', message);

    res.end(message);
    return;
  }

  debugError('Unknown URL');

  res.statusCode = 404;
  res.end('Not found');
};
