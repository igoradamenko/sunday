const { Readable } = require('stream');

class StringSteam extends Readable {
  constructor() {
    super();

    this.__length = 0;
  }

  _read(n) {
    // haha!
    if (this.__length > 10) {
      return this.emit('error', new Error('Error while reading'));
    }

    setTimeout(() => {
      this.push('a');

      this.__length += 1;
    }, 500);
  }
}

const sleep = ms => new Promise((resolve) => setTimeout(resolve, ms));
const stream = new StringSteam();

module.exports = readStream => {
  const reader = readStream(stream);

  (async function() {
    let data;
    try {
      while (data = await reader()) {
        console.log(data);
        await sleep(3000);
      }
    } catch (err) {
      console.error('Caught an error:', err);
    }
  })();
};
