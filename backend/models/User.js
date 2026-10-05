const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    channelName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    profilePicUrl: {
      type: String,
      default: "",
    },

    profilePicId: {
      type: String,
      default: "",
    },

    coverPicUrl: {
      type: String,
      default: "",
    },

    coverPicId: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    subscribers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    subscribedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);