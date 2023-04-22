var passport = require("passport");
const { UserModel } = require("./usermodel");
var GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();
const uuid = require("uuid").v4;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
      scope: ["email", "profile"],
    },
    async function (accessToken, refreshToken, profile, cb) {
      const User = new UserModel({
        name: profile.displayName,
        email: profile.emails[0].value,
        password: uuid(),
        avatar: profile.photos[0].value,
      });
      await User.save();
      return cb(null, User);
    }
  )
);

module.exports = passport;
