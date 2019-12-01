const User = require('../../models/user');
const passport = require('koa-passport');

// passport does not work with db directly

// uses _id as idField
passport.serializeUser((user, done) => done(null, user.id));

// callback version checks id validity automatically
passport.deserializeUser((id, done) => User.findById(id, done));
