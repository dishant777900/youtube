const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      default: "Other",
      trim: true,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    videoUrl: {
      type: String,
      required: true,
    },

    videoPublicId: {
      type: String,
      required: true,
    },

    thumbnailUrl: {
      type: String,
      default: "",
    },

    thumbnailPublicId: {
      type: String,
      default: "",
    },

    views: {
      type: Number,
      default: 0,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    likeCount: {
      type: Number,
      default: 0,
    },

    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    dislikeCount: {
      type: Number,
      default: 0,
    },

    dislikedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Video", videoSchema);