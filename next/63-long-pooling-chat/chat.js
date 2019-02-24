let clients = [];

exports.subscribe = (req, res) => {
  console.log('subscribe');
  res.setHeader('cache-control', 'max-age=0, no-cache, no-store, must-revalidate');
  clients.push(res);

  res.on('close', () => {
    clients.splice(clients.indexOf(res), 1);
  })
};

exports.publish = message => {
  console.log(`publish '${message}'`);

  clients.forEach(res => {
    console.log('sending to client');
    res.end(message);
  });

  clients = [];
};

setInterval(() => console.log(clients.length), 1000);
