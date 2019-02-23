const fs = require('fs');

fs.writeFile('file.tmp', 'data', err => {
  if (err) throw err;

  fs.rename('file.tmp', 'new.tmp', err => {
    if (err) throw err;

    fs.unlink('new.tmp', err => {
      if (err) throw err;
    });
  });
});
