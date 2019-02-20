const url = require('url');
const log = require('winston');

module.exports = (req, res) => {
  const urlParsed = url.parse(req.url, true);

  log.info('Incoming request', req.method, req.url);

  if (urlParsed.pathname === '/echo' && urlParsed.query.message) {
    const message = urlParsed.query.message;

    log.debug('Echo:', message);

    res.end(message);
    return;
  }

  log.error('Unknown URL');

  res.statusCode = 404;
  res.end('Not found');
};
