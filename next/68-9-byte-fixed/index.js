// 1
//
const fs = require('fs');

const fileStream = fs.createReadStream(__dirname + '/data.txt', {
  highWaterMark: 9,
  encoding: 'utf-8',
});

let content = '';
fileStream.on('data', data => {
  content += data;
});

fileStream.on('end', () => {
  console.log(content);
});












// 2
//
// const fs = require('fs');
//
// const fileStream = fs.createReadStream(__dirname + '/data.txt', {
//   highWaterMark: 9,
// });
//
// let buffers = [];
// fileStream.on('data', data => {
//   buffers.push(data)
// });
//
// fileStream.on('end', () => {
//   console.log(Buffer.concat(buffers).toString());
// });
