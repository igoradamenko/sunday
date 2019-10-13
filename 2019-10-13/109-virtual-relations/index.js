const mongoose = require('mongoose');
mongoose.set('debug', true);

mongoose.connect('mongodb://localhost/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});

userSchema.virtual('children', {
  ref: 'User', // The model to use
  localField: '_id', // Find people where `localField`
  foreignField: 'parent' // is equal to `foreignField`
});

const User = mongoose.model('User', userSchema);

(async() => {

  await User.deleteMany({});

  let greg = await User.create({ email: 'greg@gmail.com' });

  await User.create({
    email: 'john@gmail.com',
    parent: greg
  });

  await User.create({
    email: 'elizabeth@gmail.com',
    parent: greg
  });

  greg = await User.findOne({
    email: 'greg@gmail.com'
  }).populate('children');

  console.log(greg);

})().catch(console.error).then(() => mongoose.disconnect());
