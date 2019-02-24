const fs = require('fs');

// fs.ReadStream ← stream.Readable
const stream = new fs.ReadStream(__filename);

stream.on('open', () => console.log('open'));
stream.on('readable', () => {
  console.log('readable');
  stream.destroy();
});
stream.on('end', () => console.log('end'));
stream.on('close', () => console.log('close'));
