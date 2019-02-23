const fs = require('fs');

// fs.ReadStream ← stream.Readable
const stream = new fs.ReadStream(__dirname + '/big.html');

stream.on('readable', () => {
  const data = stream.read();
  console.log(data);
});

// stream.on('data', data => {
//   console.log(data);
// });

stream.on('end', () => console.log('The End'));
