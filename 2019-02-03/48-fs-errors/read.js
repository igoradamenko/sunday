const fs = require('fs');

fs.readFile('asdasdasd', (err, data) => {
  if (err) {
    console.error(err);
  } else {
    console.log(data);
  }
});
