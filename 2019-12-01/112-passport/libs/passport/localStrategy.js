let passport = require('koa-passport');
let LocalStrategy = require('passport-local');
let User = require('../../models/user');

// the strategy gets data from the field req.body
// and calls the function for them
// ctx.request.body .username, .password
passport.use(new LocalStrategy({
    usernameField: 'email', // 'username' by default
    passwordField: 'password',
    passReqToCallback: true // req for more complex cases
  },
  // there are three possible results of the fn:
  // done(null, user[, info]) ->
  //   strategy.success(user, info)
  // done(null, false[, info]) ->
  //   strategy.fail(info)
  // done(err) ->
  //   strategy.error(err)
  async function(req, email, password, done) {
    // const user = await User.findOne(...)
    User.findOne({ email }, (err, user) => {
      if (err) {
        return done(err);
      }

      // console.log(password, user, user && user.checkPassword(password));

      if (!user || !user.checkPassword(password)) {
        // don't say whether the user exists
        return done(null, false, { message: 'There is no such user or password is invalid.' });
      }
      return done(null, user);
    });
  }
));
