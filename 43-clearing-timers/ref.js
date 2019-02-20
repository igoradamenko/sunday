const http = require('http');

const server = new http.Server(() => {}).listen(3000);

let timer;

setTimeout(() => server.close(() => clearInterval(timer)), 2500);

timer = setInterval(() => {
  console.log(process.memoryUsage());
}, 1000);
