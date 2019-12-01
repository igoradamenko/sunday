// ctx.session.passport = {user: <id>}
exports.init = app => app.use(require('koa-passport').session());
