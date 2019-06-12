const fs = require('fs');

function readStream(stream) {
  // ...
}

async function read(path) {
  let stream = fs.createReadStream(path, { highWaterMark: 60, encoding: 'utf-8' });

  let data;

  // ЗАДАЧА: написать такой readStream
  // смысл в том, что мы хотим работать с потоками,
  // но делать это именно через такой интерфейс
  let reader = readStream(stream);

  while(data = await reader()) {
    console.log(data);
  }
}

read(__filename).catch(console.error);
