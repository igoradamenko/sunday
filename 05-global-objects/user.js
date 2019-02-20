function User(name) {
  this.name = name;
}

User.prototype.hello = function(who) {
  console.log('hello, ' + who.name);
};

console.log('user.js is required');

global.User = User;
