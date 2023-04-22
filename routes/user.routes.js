const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcrypt");
const UserRouter = express.Router();
const { User } = require("../models/user.model");
const redis = require("redis");
const { authentication } = require("../middlewares/authentication");
const { Blacklist } = require("../models/blacklist.model");
const passport = require("../middlewares/google.auoth");
const cors = require("cors");


UserRouter.use(cors());

UserRouter.post("/signup", async (req, res) => {
  try {
    let exist = await User.findOne({ email: req.body.email });
    if (exist) {
      return res.status(400).send({ error: "User already exists" });
    }

    const { name, contact, email, password, role } = req.body;
    const user = new User({ name, contact, email, password, role });
    await user.save();
    res.send({ message: "Registered Successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

UserRouter.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    let TosendUser = user;
    if (!user) {
      return res.status(400).send({ error: "User Does Not Exists" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ error: "Invalid Credentials" });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: "7d",
      }
    );

    req.cookies.token = token;
    req.cookies.refreshToken = refreshToken;

    TosendUser.password = "**********";
    res.send({
      msg: "Login Successful",
      user: TosendUser,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

//  hit this url to login with google
UserRouter.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

// callback url after login with google
UserRouter.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  function (req, res) {
    console.log(req.user);
  }
);

UserRouter.get("/refresh-token", async (req, res) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).send({ msg: "Please Login Again*" });
    }
    const refreshToken = req.headers.authorization.split(" ")[1];
    if (!refreshToken) {
      return res.status(401).send({ msg: "Please Login Again" });
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const token = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    const _id = decoded.userId;
    const TosendUser = await User.findOne({ _id }).select("-password");
    res.send({ user: TosendUser, token });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

UserRouter.get("/me", authentication, async (req, res) => {
  try {
    const _id = req.user._id;
    const user = await User.findOne({ _id }).select("-password");
    res.send({ user });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

UserRouter.get("/logout", authentication, async (req, res) => {
  try {
    if (!req.cookies.token) {
      return res.status(401).send({ msg: "Please Login Again*" });
    }
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).send({ msg: "Please Login Again" });
    }
    await Blacklist({ btoken: token }).save();
    res.send({ msg: "Logged Out Successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

UserRouter.delete("/delete", authentication, async (req, res) => {
  try {
    const _id = req.user._id;
    const user = await User.findByIdAndDelete(_id);
    if (!user) {
      return res.status(400).send({ msg: "User Not Found" });
    }
    res.send({ msg: "Account Deleted Successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = { UserRouter };
