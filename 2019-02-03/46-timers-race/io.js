const fs = require('fs');

fs.open(__dirname, 'r', (err, file) => console.log('IO!'));

setImmediate(() => console.log('setImmediate'));

process.nextTick(() => console.log('process.nextTick'));
