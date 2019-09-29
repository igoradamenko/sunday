const Koa = require('koa');
const app = new Koa();

app.use(async function(ctx, next) {
  try {
    await next();
  } catch (e) {
    if (e.status) { // User error
      ctx.body = e.message;
      ctx.status = e.status;
    } else { // Server error
      ctx.body = 'Error 500';
      ctx.status = 500;
      console.error(e.message, e.stack);
    }

    let type = ctx.accepts('html', 'json');
    if (type === 'json') {
      ctx.body = {
        error: ctx.body
      };
    }
  }
});

app.use(async function(ctx, next) {
  switch(ctx.url) {
    case '/1':
      // everything dies
      await new Promise(() => {
        setTimeout(() => {
          throw new Error('Error in callback')
        }, 1000);
      });
      break;

    case '/2':
      // normal error-handling, 500
      await new Promise(function(resolve, reject) {
        setTimeout(reject, 1000, new Error('Error in callback'));
      });
      break;

    case '/3':
      // normal error-handling, 500
      throw new Error('Error thrown');

    case '/4':
      // user-level error (the difference: error.status), show 403
      ctx.throw(403, 'Sorry, access denied');

    default:
      ctx.body = 'ok';
  }

});

app.listen(3000);
