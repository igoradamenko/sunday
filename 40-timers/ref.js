const http = require('http');

const server = new http.Server(() => {}).listen(3000);

setTimeout(() => server.close(), 2500);
