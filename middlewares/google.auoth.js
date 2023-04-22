var passport = require("passport");
const { UserModel } = require("../models/user.model");
var GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();
const uuid = require("uuid").v4;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://medeasyin.netlify.app/HTML/indexa.html",
      scope: ["email", "profile"],
    },
    async function (accessToken, refreshToken, profile, cb) {
      const ispresent = await UserModel.findOne({ googleId: profile.id });

      if (ispresent) {
        return cb(null, ispresent);
      }

      const user = new UserModel({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        password: uuid(),
        avatar: profile.photos[0].value,
        role : "user"
      });
      await user.save();
      return cb(null, user);
    }
  )
);

module.exports = passport;
