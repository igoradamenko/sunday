const {createServer} = require('http');

const server = createServer((req, res) => {

  switch (req.url) {

    case '/shutdown':
      res.end('shutting down');

      server.destroy(() => console.log('closed'));
      // server.close(() => console.log('closed'));

      break;

    case '/wait':
      setTimeout(() => res.end('done'), 10000);
      break;

    default:
      res.end('up and running!');
  }

});

const connections = {};
let id = 0;

// track connections
server.on('connection', function(conn) {
  connections[++id] = conn;
  conn.id = id;
  conn.on('close', function() {
    delete connections[id];
  });
});

server.listen(3000);

setInterval(() => {
  console.log(Object.keys(connections));
}, 1000).unref();





server.on('request', (req, res) => {
  let conn = req.socket; // = res.socket
  conn.isIdle = false;
  res.on('finish', () => {
    conn.isIdle = true;
    conn.emit('idle');
  })
});

server.destroy = function(cb) {
  this.close(cb);
  for (let key in connections) {
    let conn = connections[key];
    if (conn.isIdle) {
      conn.destroy();
    } else {
      conn.once('idle', () => conn.destroy());
    }
  }
};
