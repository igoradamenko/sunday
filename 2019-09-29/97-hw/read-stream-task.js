const fs = require('fs');

function readStream(stream) {
  let errors = [];
  stream.on('error', e => errors.push(e));

  return () => new Promise((resolve, reject) => {
    function stopListening() {
      stream.pause();

      stream
        .off('data', data)
        .off('error', error);
    }

    function data(readData) {
      stopListening();
      resolve(readData)
    }

    function error(e) {
      stopListening();
      reject(e)
    }

    if (errors.length) {
      return reject(errors.shift());
    }

    stream
      .on('data', data)
      .on('error', error);

    stream.resume();
  });
}

async function read(path) {
  let stream = fs.createReadStream(path, { highWaterMark: 60, encoding: 'utf-8' });
  let data;
  let reader = readStream(stream);

  const sleep = ms => new Promise((resolve) => setTimeout(resolve, ms));

  while (data = await reader()) {
    console.log(data);
    await sleep(3000);
  }
}

read(__filename).catch(console.error);

// require('./tester')(readStream);
