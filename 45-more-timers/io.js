const http = require('http');

http.createServer((req, res) => {
  // async stuff; setTimeout? process.nextTick? setImmediate?
}).listen(3000);
