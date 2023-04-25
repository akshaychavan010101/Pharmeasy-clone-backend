const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcrypt");
const sgMail = require("@sendgrid/mail");
const UserRouter = express.Router();
const { User } = require("../models/user.model");
const redis = require("redis");
const { authentication } = require("../middlewares/authentication");
const { Blacklist } = require("../models/blacklist.model");
const passport = require("passport");
require("../middlewares/google.auoth");
const uuid = require("uuid").v4;

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

// sending the password reset link to the user via email
UserRouter.get("/forgot-password", (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.send({ msg: "Please provide email" });
    }
    let webid = uuid();
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // change the url to send;
    const messages = [
      {
        to: `${email}`,
        from: "akki010102@gmail.com",
        subject: "Change Password",
        text: "Hello from MedEasyIn",
        html: `
      <h1>MedEasyIn</h1>
      <p>Click on the link below to change your password</p>
      <b>This is a one time link to update your password</b>
      <a href="http://127.0.0.1:5501/index.html?webid=${webid}">Click here to reset your password</a>
`,
      },
    ];
    sgMail.send(messages).then((success, error) => {
      if (error) {
        res.send({
          msg: "Something Went Wrong",
          Error: error.response.body,
        });
      } else {
        res.send({ msg: "Check your mail box to reset your password" });
      }
    });
  } catch (error) {
    res.send({ msg: error });
  }
});

UserRouter.patch("/password-update", async (req, res) => {
  try {
    const { email, password, webid } = req.query;
    const user = await UserModel.findOne({ email });
    if (user) {
      if (webid === undefined) {
        return res.json({ msg: "This link is not valid" });
      }
      if (user.webid.includes(webid)) {
        return res.json({ msg: "This link is already used" });
      }

      user.password = password;
      user.webid.push(webid);

      await user.save();
      res.status(200).json({ msg: "Password updated successfully" });
    } else {
      res.send({ msg: "something went wrong" });
    }
  } catch (error) {
    console.log(error);
    res.send({ msg: "server error", error });
  }
});

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
