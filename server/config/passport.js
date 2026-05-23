const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

passport.use(new LocalStrategy(
  { usernameField: 'voterId', passwordField: 'password' },
  async (voterId, password, done) => {
    try {
      const user = await User.findOne({ voterId: voterId.trim() });
      if (!user) return done(null, false, { message: 'Invalid voter ID or password.' });

      const match = await user.comparePassword(password);
      if (!match) return done(null, false, { message: 'Invalid voter ID or password.' });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
