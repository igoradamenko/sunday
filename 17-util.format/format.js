const util = require('util');

const str = util.format('My %s %d %j', 'string', 123, {a: 1});

console.log(str);
