function User(name) {
  this.name = name;
}

User.prototype.hello = function(who) {
  console.log('hello, ' + who.name);
};

const vasya = new User('vasya');
const petya = new User('petya');

vasya.hello(petya);
