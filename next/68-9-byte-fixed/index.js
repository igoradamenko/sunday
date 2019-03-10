const fs = require('fs');

const fileStream = fs.createReadStream(__dirname + '/data.txt', {
  highWaterMark: 9,
});

let content = '';
fileStream.on('data', data => {
  content += data;
});

fileStream.on('end', () => {
  console.log(content);
});
