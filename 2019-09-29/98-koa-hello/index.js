const Koa = require('koa');
const app = new Koa();

/**
 * Основные объекты:
 * ctx.req / ctx.res
 * ctx.request / ctx.response
 * ctx
 *
 * Основные операции:
 * ctx.set / ctx.get
 * ctx.body =
 */

app.use(async (ctx, next) => {
  await new Promise(resolve => setTimeout(resolve, 3000));

  // ctx.response.body = 'hello';
  ctx.body = 'hello';

  console.log('Said hello');
});

console.log('Listen on 3000 port');

app.listen(3000);
