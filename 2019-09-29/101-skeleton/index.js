if (process.env.TRACE) {
  require('./libs/trace');
}

const Koa = require('koa');
const app = new Koa();

const config = require('config');

const path = require('path');
const fs = require('fs');

const handlers = fs.readdirSync(path.join(__dirname, 'handlers')).sort();

handlers.forEach(handler => require('./handlers/' + handler).init(app));

// ---------------------------------------

// can be split into files too
const Router = require('koa-router');

const router = new Router();

router.get('/views', async (ctx, next) => {
  let count = ctx.session.count || 0;
  ctx.session.count = ++count;

  ctx.body = ctx.render('./templates/index.pug', {
    user: 'John',
    count
  });
});

router.get('/', async (ctx) => {
  ctx.body = '1';
});

router.get('/user/:user', async (ctx) => {
  ctx.body = 'Hello, ' + ctx.params.user;
});

app.use(router.routes());

app.listen(3000);
