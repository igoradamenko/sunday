const http = require('http');
const debug = require('debug')('server');

const server = new http.Server(require('./request'));

server.listen(1337, '127.0.0.1');

debug('Server is running');
