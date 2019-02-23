const User = require('./user');

function run() {
  const vasya = new User('vasya');
  const petya = new User('petya');

  vasya.hello(petya);
}

if (module.parent) {
  exports.run = run;
} else {
  run();
}
