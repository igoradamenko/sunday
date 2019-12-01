if (process.env.TRACE) {
  require('./libs/trace');
}

const Koa = require('koa');
const app = new Koa();

require('./db');
require('./handlers')(app);

const userRoutes = require('./routes/user');

app.use(userRoutes);

module.exports = app;
