const http = require('http');

function loadUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(loadUrl(res.headers.location));
      }

      if (res.statusCode !== 200) {
        reject(new Error(`Bad response status ${res.statusCode}.`));
        return;
      }

      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => (body += chunk));
      res.on('end', () => resolve(body));

    }) // ENOTFOUND (no such host) or ECONNRESET (server destroys connection)
      .on('error', reject);
  });
}

loadUrl('http://google.com')
.then(
  result => console.log('Result:', result),
  error => console.error('Error:', error)
);
