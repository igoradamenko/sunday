const http = require('http');

const server = new http.Server(); // event emitter

server.listen(1337, '127.0.0.1');

const emit = server.emit;
server.emit = function(event) {
  console.log(event);
  emit.apply(server, arguments);
};

server.on('request', (req, res) => {
  res.end('Hello, world!');
});
