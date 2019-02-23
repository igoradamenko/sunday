const user = require('./user');

function run() {
  const vasya = new user.User('vasya');
  const petya = new user.User('petya');

  vasya.hello(petya);
}

if (module.parent) {
  exports.run = run;
} else {
  run();
}
