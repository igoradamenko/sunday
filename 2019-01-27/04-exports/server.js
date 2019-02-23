const user = require('./user');

const vasya = new user.User('vasya');
const petya = new user.User('petya');

vasya.hello(petya);
