const db = require('../db');

function User(name) {
  this.name = name;
}

User.prototype.hello = function(who) {
  console.log(db.getPhrase('hello') + ', ' + who.name);
};

module.exports = User;
