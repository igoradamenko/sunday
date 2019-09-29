// Usually served by Nginx
const favicon = require('koa-favicon');

exports.init = app => app.use(favicon());

/*
  async function(ctx, next) {
    if (ctx.url === '/favicon') {
      ctx.body = favicon;
      return;
    }

    await next();
  }
*/
