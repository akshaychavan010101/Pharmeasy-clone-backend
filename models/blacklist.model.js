const mongoose = require("mongoose");

const btokenSchema = new mongoose.Schema(
  {
    btoken: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 7,
    },
  },
  { versionKey: false }
);

const Blacklist = mongoose.model("btoken", btokenSchema);

module.exports = { Blacklist };
