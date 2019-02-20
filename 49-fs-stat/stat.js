const fs = require('fs');

fs.stat(__filename, (err, stats) => {
  console.log(stats.isFile());
  console.log(stats);
});
