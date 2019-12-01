const logger = require('koa-logger');

module.exports = app => app.use(logger());
