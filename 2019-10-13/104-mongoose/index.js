const mongoose = require('mongoose');
mongoose.set('debug', true);

// actually here is a promise
mongoose.connect('mongodb://localhost/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String, // https://docs.mongodb.com/manual/reference/bson-types/index.html
      required: 'Enter an email',
      unique: true, // note: mongo level, not mongoose!
      validate: [{
        validator(value) { return /^[-.\w]+@([\w-]+\.)+[\w-]{2,12}$/.test(value) },
        msg: 'Please enter correct email.'
      }],
      lowercase: true,
      trim: true
    },
    name: String,
    surname: String,
    gender: {
      type: String,
      enum: ['M', 'F'], // enum validator
      default: 'M'
    }
  },
  {
    timestamps: true // createdAt, updatedAt
  }
);

userSchema.methods.getFullName = function() {
  return `${this.name} ${this.surname}`;
};

userSchema.methods.getPublicFields = function() {
  return {
    email: this.email,
    gender: this.gender
  };
};

const User = mongoose.model('User', userSchema);

const john = new User({
  email: 'john@example.com',
  gender: 'M'
});

// note: _id
console.log(john);
console.log(john.getPublicFields());

// const brokenJohn = new User({
//   email: 'johnexample.com',
//   gender: 'M'
// });
//
// // note: no errors
// console.log(brokenJohn);

// no error handling here
(async () => {
  console.log('removed', await User.deleteMany({}));

  console.log('saved', await john.save());
  // console.log('saved', await brokenJohn.save());

  console.log('found', await User.findOne({ email: 'john@example.com' }));

  await mongoose.disconnect();
})();

