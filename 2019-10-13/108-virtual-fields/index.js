const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

const userSchema = new mongoose.Schema({
  name: String,
  surname: String
});

userSchema.virtual('fullName')
  .get(function() {
    return `${this.name} ${this.surname}`;
  })
  .set(function(value) {
    [this.name, this.surname] = value.trim().split(/\s+/);
  });

const User = mongoose.model('User', userSchema);

let user = new User({
  name: 'John',
  surname: 'Smith'
});

console.log(user.fullName); // John Smith

user.fullName = 'Greg Holland';

console.log(user.fullName); // Greg Holland

user.save().then(console.log)
