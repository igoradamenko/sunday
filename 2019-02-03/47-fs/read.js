const fs = require('fs');

// what will I get here?
fs.readFile(__filename, (err, data) => {
  if (err) {
    console.error(err);
  } else {
    console.log(data);
  }
});
