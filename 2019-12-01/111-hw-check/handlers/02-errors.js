module.exports = app => app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    // user errors
    if (err.status) {
      ctx.status = err.status;
      ctx.body = err.message;
      return;
    }

    // mongoose wrong id or not found error
    if (err.name === 'CastError' || err.name === 'DocumentNotFoundError') {
      ctx.status = 404;
      return;
    }

    // mongoose validation error
    if (err.name === 'ValidationError') {
      const errors = {};

      Object.keys(err.errors).forEach(key => {
        errors[key] = err.errors[key].message;
      });

      ctx.status = 400;
      ctx.body = { errors };
      return;
    }

    // bad shit
    ctx.status = 500;
    console.dir(err, { depth: 5 });
  }
});
