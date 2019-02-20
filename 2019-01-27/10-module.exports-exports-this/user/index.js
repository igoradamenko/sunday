const phrases = require('./ru');

function User(name) {
  this.name = name;
}

User.prototype.hello = function(who) {
  console.log(phrases.hello + ', ' + who.name);
};

module.exports = User; // module.exports = exports = this
