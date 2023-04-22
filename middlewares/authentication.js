const jwt = require("jsonwebtoken");
require("dotenv").config();


const { User } = require("../models/user.model");
const { Blacklist } = require("../models/blacklist.model");

const authentication = async (req, res, next) => {
  try {
    if (!req.cookies.token) {
      return res.send({ msg: "Please Login" });
    }

    const token = req.cookies.token;

    const isBlacklist = await Blacklist.findOne({ btoken: token });

    if (!token || isBlacklist) {
      return res.send({ msg: "Please Login*" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded.userId,
    });

    if (!user) {
      return res.send({ msg: "Please Login**" });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

module.exports = { authentication };
