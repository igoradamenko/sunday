const http = require('http');

function loadUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
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

Promise.all([
  loadUrl('http://ya.ru'),
  loadUrl('http://yandex.ru'),
  loadUrl('http://google.com')
])
.then(
  results => console.log('Result:', results),
  error => console.error('Error:', error)
);
