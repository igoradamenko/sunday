const fs = require('fs');

fs.open(__filename, 'r', () => {
  console.log('IO'); // 1
});

setImmediate(() => {
  console.log('immediate'); // 2
});

process.nextTick(() => {
  console.log('nextTick'); // 3
});

new Promise(resolve => {
  resolve('promise'); // 4
}).then(console.log);

console.log('start'); // 5
