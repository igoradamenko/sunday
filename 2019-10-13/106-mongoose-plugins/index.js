const mongoose = require('mongoose');
const beautifyUnique = require('@noname-land/mongoose-beautiful-unique-validation');

mongoose.connect('mongodb://localhost/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// instead of MongoError there will be ValidationError
mongoose.plugin(beautifyUnique);

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: 'Add an email',
    unique: 'There is such email {VALUE}'
  }
});

const User = mongoose.model('User', userSchema);

(async() => {

  await User.deleteMany({});

  await User.create({ email: 'new-user@example.com' });
  await User.create({ email: 'new-user@example.com' });

})()
.catch(err => console.error(err))
.finally(() => mongoose.disconnect());
