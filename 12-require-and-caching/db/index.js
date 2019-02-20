let phrases;

exports.connect = () => {
  phrases = require('./ru');
};

exports.getPhrase = name => {
  if (!phrases[name]) {
    throw new Error('there is no such phrase: ' + name);
  }

  return phrases[name];
};
