const User = require('../models/user');

const Router = require('koa-router');

const router = new Router({
  prefix: '/users',
});

router.get('/', async (ctx) => {
  ctx.body = (await User.find()).map(x => x.getPublicFields());
});

router.get('/:id', async (ctx) => {
  ctx.body = (await User.findById(ctx.params.id).orFail()).getPublicFields();
});

router.post('/', async (ctx) => {
  const user = await User.create(User.filterObject(ctx.request.body));
  ctx.body = {
    id: user.id,
  };
});

router.patch('/:id', async (ctx) => {
  await User.updateOne(
    { _id: ctx.params.id },
    { $set: User.filterObject(ctx.request.body) },
    { runValidators: true }, // https://mongoosejs.com/docs/validation.html#update-validators
  ).orFail();

  // await User.findByIdAndUpdate(
  //   ctx.params.id,
  //   { $set: User.filterObject(ctx.request.body) },
  //   { runValidators: true },
  // ).orFail();

  ctx.body = 'ok';
});

router.delete('/:id', async (ctx) => {
  await User.deleteOne({ _id: ctx.params.id }).orFail();
  ctx.body = 'ok';
});

module.exports = router.routes();

// router.param('id', async (id, ctx, next) => {
//   https://mongodb.github.io/node-mongodb-native/api-bson-generated/objectid.html
//   if (!mongoose.Types.ObjectId.isValid(id)) ctx.throw(404);
//
//   ctx.user = await User.findById(id);
//
//   if (!ctx.user) ctx.throw(404);
//
//   await next();
// });
