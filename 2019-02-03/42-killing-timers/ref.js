const http = require('http');

const server = new http.Server(() => {}).listen(3000);

setTimeout(() => server.close(() => process.exit()), 2500);

setInterval(() => {
  console.log(process.memoryUsage());
}, 1000);
