const db = require('./db');
db.connect();

const User = require('./user');

function run() {
  const vasya = new User('vasya');
  const petya = new User('petya');

  vasya.hello(petya);

  console.log(db.getPhrase('run successful'));
}

if (require.main === module) {
  run();
} else {
  exports.run = run;
}
