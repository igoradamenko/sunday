const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: 'Email is not found',
    unique: 'Email is not unique',
    validate: [{
      validator: isEmailValid,
      msg: 'Email is not valid'
    }],
    lowercase: true,
    trim: true,
  },
  displayName: {
    type: String,
    required: 'Display name is not found',
    trim: true,
  }
}, {
  timestamps: true,
});

userSchema.methods.getPublicFields = function() {
  return {
    id: this._id,
    email: this.email,
    displayName: this.displayName,
  };
};

userSchema.statics.filterObject = raw => {
  const allowed = ['email', 'displayName'];

  return allowed.reduce((obj, key) => {
    if (key in raw) obj[key] = raw[key];
    return obj;
  }, {});
};

module.exports = mongoose.model('User', userSchema);

function isEmailValid(value) {
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value);
}
