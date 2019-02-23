const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');

const ROOT = `${__dirname}/public`;

http.createServer((req, res) => {
  if (!checkAccess(req)) {
    res.statusCode = 403;
    res.end('You Shall Not Pass!');
    return;
  }

  sendFileSafe(url.parse(req.url).pathname, res);
}).listen(3000);

function checkAccess(req) {
  return url.parse(req.url, true).query.secret === 'yo';
}

function sendFileSafe(filepath, res) {
  try {
    filepath = decodeURIComponent(filepath);
  } catch(e) {
    res.statusCode = 400;
    res.end('Bad Request');
    return;
  }

  if (filepath.includes('\0')) {
    res.statusCode = 400;
    res.end('Bad Request');
    return;
  }

  filepath = path.normalize(path.join(ROOT, filepath));

  if (!filepath.startsWith(ROOT)) {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }

  fs.stat(filepath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }

    sendFile(filepath, res);
  });
}

function sendFile(filepath, res) {
  res.end(fs.readFileSync(filepath, 'utf-8'));
}

// ls -la
