const http = require('http');
const log = require('winston');

const server = new http.Server(require('./request'));

server.listen(1337, '127.0.0.1');

log.info('Server is running');
