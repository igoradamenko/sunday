const mongoose = require('mongoose');
mongoose.set('debug', true)

mongoose.connect('mongodb://localhost/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: 'Add an email',
    unique: true
  },
  friends: [{
    type: mongoose.ObjectId,
    ref: 'User'
  }]
});

const User = mongoose.model('User', userSchema);

(async function () {

  await User.deleteMany({});

  let greg = await User.create({ email: 'greg@example.com' });
  let john = await User.create({ email: 'john@example.com' });
  let elizabeth = await User.create({ email: 'elizabeth@example.com' });

  greg.friends = [john, elizabeth];

  // MongooseArray, not Array
  // greg.friends.addToSet(john);

  console.log(greg);

  await greg.save();

  greg = await User.findOne({
    email: 'greg@example.com'
  }).populate('friends');

  console.log(greg);

  // deep (multi-level) populate: http://mongoosejs.com/docs/populate.html#deep-populate

})().catch(console.error).then(() => mongoose.disconnect());
