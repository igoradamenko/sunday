const config = require('config');

const mongoose = require('mongoose');
const beautifyUnique = require('@noname-land/mongoose-beautiful-unique-validation');

mongoose.plugin(beautifyUnique);

// mongoose.set('debug', true);

mongoose.connect(config.mongo.uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  // useFindAndModify: false,
});

const db = mongoose.connection;

db.on('connected', () => console.log('Mongoose connected to', config.mongo.uri));
db.on('error', err => {
  console.error('Mongoose connection error:', err);
  process.exit(1);
});

module.exports = db;
