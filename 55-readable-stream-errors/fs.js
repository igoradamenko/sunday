const fs = require('fs');

// fs.ReadStream ← stream.Readable
const stream = new fs.ReadStream('nothing');

stream.on('readable', () => {
  const data = stream.read();
  console.log(data);
});

stream.on('end', () => console.log('The End'));
