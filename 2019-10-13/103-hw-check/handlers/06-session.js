// in-memory store by default (use the right module instead)
const session = require('koa-generic-session');

exports.init = app => app.use(session({
  cookie: {
    signed: false
  }
}));
