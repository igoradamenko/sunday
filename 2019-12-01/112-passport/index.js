// A "closer to real-life" app example
// using 3rd party middleware modules
// P.S. MWs calls be refactored in many files

// long stack trace (+clarify from co) if needed
if (process.env.TRACE) {
  require('./libs/trace');
}

/*
  Ivan: {amount: 100}
  Masha: {amount: 20}

  Hacker: {amount: 0}
  _csrf()
  POST /transferMoney?from=Ivan&to=Masha&amount=50&csrf=ksajf;4ifu3
    if (
      ctx.isAuthenticated() &&
      ctx.state.user.name === ctx.query.from &&
      ctx.state.user.amount >= ctx.query.amount
    ) {
      transferMoney!
    }

  facebook:
    hi Ivan! look at this cat:
      <a href="/transferMoney?from=Ivan&to=Hacker&amount=50">CAT</a>
*/


const Koa = require('koa');
const app = new Koa();

const config = require('config');
const mongoose = require('./libs/mongoose');

const path = require('path');
const fs = require('fs');

const handlers = fs.readdirSync(path.join(__dirname, 'middlewares')).sort();

handlers.forEach(handler => require('./middlewares/' + handler).init(app));

// ---------------------------------------

// can be split into files too
const Router = require('koa-router');

const router = new Router();

router.get('/', require('./routes/frontpage').get);
router.post('/login', require('./routes/login').post);
router.post('/logout', require('./routes/logout').post);
// router.get('/', require('./routes/login').post);

app.use(router.routes());

app.listen(3000);
