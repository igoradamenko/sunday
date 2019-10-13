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

let clients = [];

router.get('/', async (ctx) => {
  ctx.body = ctx.render('./templates/index.pug');
});

router.get('/subscribe', async (ctx) => {
  ctx.set('Cache-Control', 'no-cache, must-revalidate');

  const awaiter = () => new Promise((resolve, reject) => {
    clients.push(resolve);

    ctx.req.on('close', () => {
      clients = clients.filter(x => x === resolve);

      const error = new Error('Connection closed by user');
      error.code = 'ECONNRESET';
      reject(error);
    })
  });

  try {
    ctx.body = await awaiter();
  } catch (err) {
    if (err.code === 'ECONNRESET') return;
    throw err;
  }
});

router.post('/publish', async (ctx) => {
  if (!ctx.request.body || !ctx.request.body.message) {
    ctx.throw(400);
  }

  clients.forEach(resolve => resolve(ctx.request.body.message));
  clients = [];

  ctx.body = 'ok';
});

app.use(router.routes());

app.listen(3000);
