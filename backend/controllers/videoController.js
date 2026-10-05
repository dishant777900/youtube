const Video = require("../models/Video");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");


// GET USER FROM OPTIONAL TOKEN
const getUserFromToken = (req) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return null;
    }

    if (!authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return null;
    }

    return jwt.verify(token, process.env.SEC_KEY);
  } catch (err) {
    return null;
  }
};


// CHECK LIKE / DISLIKE / SUBSCRIBE STATUS
const getVideoStatus = async (video, userId) => {
  if (!userId) {
    return {
      likedStatus: false,
      dislikedStatus: false,
      subscribe: false,
    };
  }

  const likedStatus = video.likedBy.some(
    (id) => id.toString() === userId.toString()
  );

  const dislikedStatus = video.dislikedBy.some(
    (id) => id.toString() === userId.toString()
  );

  let subscribe = false;

  if (video.uploadedBy) {
    const channel = await User.findById(video.uploadedBy._id || video.uploadedBy)
      .select("subscribers");

    if (channel) {
      subscribe = channel.subscribers.some(
        (id) => id.toString() === userId.toString()
      );
    }
  }

  return {
    likedStatus,
    dislikedStatus,
    subscribe,
  };
};


// UPLOAD VIDEO
const upload = async (req, res) => {
  let uploadedVideo = null;
  let uploadedThumbnail = null;

  try {
    const tokenData = getUserFromToken(req);

    if (!tokenData) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    if (!req.body.title || !req.body.title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Video title is required",
      });
    }

    if (!req.files || !req.files.video) {
      return res.status(400).json({
        success: false,
        message: "Video file is required",
      });
    }

    if (!req.files.thumbnail) {
      return res.status(400).json({
        success: false,
        message: "Thumbnail is required",
      });
    }

    const user = await User.findById(tokenData._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Upload video to Cloudinary
    uploadedVideo = await cloudinary.uploader.upload(
      req.files.video.tempFilePath,
      {
        resource_type: "video",
        folder: "sbstube/video",
      }
    );

    // Upload thumbnail to Cloudinary
    uploadedThumbnail = await cloudinary.uploader.upload(
      req.files.thumbnail.tempFilePath,
      {
        resource_type: "image",
        folder: "sbstube/thumbnail",
      }
    );

    // Convert tags into array
    let tags = [];

    if (req.body.tags) {
      if (Array.isArray(req.body.tags)) {
        tags = req.body.tags;
      } else {
        tags = req.body.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
      }
    }

    const newVideo = new Video({
      title: req.body.title.trim(),

      description: req.body.description
        ? req.body.description.trim()
        : "",

      category: req.body.category
        ? req.body.category.trim()
        : "Other",

      tags,

      videoUrl: uploadedVideo.secure_url,
      videoPublicId: uploadedVideo.public_id,

      thumbnailUrl: uploadedThumbnail.secure_url,
      thumbnailPublicId: uploadedThumbnail.public_id,

      uploadedBy: tokenData._id,
    });

    const savedVideo = await newVideo.save();

    const populatedVideo = await Video.findById(savedVideo._id)
      .populate(
        "uploadedBy",
        "channelName profilePicUrl coverPicUrl subscribers"
      );

    return res.status(201).json({
      success: true,
      message: "Video uploaded successfully",

      video: {
        ...populatedVideo._doc,

        subscribersCount:
          populatedVideo.uploadedBy?.subscribers?.length || 0,

        likedStatus: false,
        dislikedStatus: false,
        subscribe: false,
      },
    });
  } catch (err) {
    console.error("Upload video error:", err);

    // Delete Cloudinary video if thumbnail/database operation failed
    if (uploadedVideo?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadedVideo.public_id, {
          resource_type: "video",
        });
      } catch (deleteError) {
        console.error("Cloudinary video cleanup error:", deleteError);
      }
    }

    if (uploadedThumbnail?.public_id) {
      try {
        await cloudinary.uploader.destroy(
          uploadedThumbnail.public_id
        );
      } catch (deleteError) {
        console.error("Cloudinary thumbnail cleanup error:", deleteError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to upload video",
      error: err.message,
    });
  }
};


// GET ALL VIDEOS
const allVideo = async (req, res) => {
  try {
    const tokenData = getUserFromToken(req);

    const allvideos = await Video.find()
      .sort({ publishedAt: -1 })
      .populate(
        "uploadedBy",
        "channelName profilePicUrl coverPicUrl subscribers"
      );

    const videos = await Promise.all(
      allvideos.map(async (video) => {
        const status = await getVideoStatus(
          video,
          tokenData?._id || null
        );

        return {
          ...video._doc,

          subscribersCount:
            video.uploadedBy?.subscribers?.length || 0,

          likedStatus: status.likedStatus,
          dislikedStatus: status.dislikedStatus,
          subscribe: status.subscribe,
        };
      })
    );

    return res.status(200).json({
      success: true,
      videos,
    });
  } catch (err) {
    console.error("Get all videos error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to get videos",
      error: err.message,
    });
  }
};


// GET video by id
const getVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate(
        "uploadedBy",
        "channelName profilePicUrl coverPicUrl subscribers description"
      );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Increase view count
    video.views += 1;
    await video.save();

    const tokenData = getUserFromToken(req);

    const status = await getVideoStatus(
      video,
      tokenData?._id || null
    );

    const newResponse = {
      ...video._doc,

      subscribersCount:
        video.uploadedBy?.subscribers?.length || 0,

      likedStatus: status.likedStatus,
      dislikedStatus: status.dislikedStatus,
      subscribe: status.subscribe,
    };

    return res.status(200).json({
      success: true,
      video: newResponse,
    });
  } catch (err) {
    console.error("Get video error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to get video",
      error: err.message,
    });
  }
};


// LIKE / UNLIKE VIDEO
const likeVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId)
      .populate(
        "uploadedBy",
        "channelName profilePicUrl subscribers"
      );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const tokenData = getUserFromToken(req);

    // NO TOKEN
    if (!tokenData) {
      return res.status(401).json({
        success: true,
        message: "Login required to like this video",

        // video: video,

        // likeCount: video.likeCount,
        // dislikeCount: video.dislikeCount,

        // likedStatus: false,
        // dislikedStatus: false,
        // subscribe: false,
      });
    }

    const userId = tokenData._id;

    const isLiked = video.likedBy.some(
      (id) => id.toString() === userId.toString()
    );

    if (isLiked) {
      // UNLIKE
      video.likedBy = video.likedBy.filter(
        (id) => id.toString() !== userId.toString()
      );

      video.likeCount = Math.max(0, video.likeCount - 1);
    } else {
      // Remove dislike first
      const isDisliked = video.dislikedBy.some(
        (id) => id.toString() === userId.toString()
      );

      if (isDisliked) {
        video.dislikedBy = video.dislikedBy.filter(
          (id) => id.toString() !== userId.toString()
        );

        video.dislikeCount = Math.max(
          0,
          video.dislikeCount - 1
        );
      }

      // LIKE
      video.likedBy.push(userId);
      video.likeCount += 1;
    }

    await video.save();

    const status = await getVideoStatus(video, userId);

    return res.status(200).json({
      success: true,

      message: isLiked
        ? "Video unliked successfully"
        : "Video liked successfully",

      videoId: video._id,

      likeCount: video.likeCount,
      dislikeCount: video.dislikeCount,

      likedStatus: status.likedStatus,
      dislikedStatus: status.dislikedStatus,
      subscribe: status.subscribe,
    });
  } catch (err) {
    console.error("Like video error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to like video",
      error: err.message,
    });
  }
};



// DISLIKE / UNDISLIKE VIDEO
const dislikeVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId)
      .populate(
        "uploadedBy",
        "channelName profilePicUrl subscribers"
      );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const tokenData = getUserFromToken(req);


    // NO TOKEN
    if (!tokenData) {
      return res.status(401).json({
        success: true,
        message: "Login required to dislike this video",

        // video: video,

        // likeCount: video.likeCount,
        // dislikeCount: video.dislikeCount,

        // likedStatus: false,
        // dislikedStatus: false,
        // subscribe: false,
      });
    }

    const userId = tokenData._id;

    const isDisliked = video.dislikedBy.some(
      (id) => id.toString() === userId.toString()
    );

    if (isDisliked) {
      // UNDISLIKE
      video.dislikedBy = video.dislikedBy.filter(
        (id) => id.toString() !== userId.toString()
      );

      video.dislikeCount = Math.max(
        0,
        video.dislikeCount - 1
      );
    } else {
      // Remove like first
      const isLiked = video.likedBy.some(
        (id) => id.toString() === userId.toString()
      );

      if (isLiked) {
        video.likedBy = video.likedBy.filter(
          (id) => id.toString() !== userId.toString()
        );

        video.likeCount = Math.max(
          0,
          video.likeCount - 1
        );
      }

      // DISLIKE
      video.dislikedBy.push(userId);
      video.dislikeCount += 1;
    }

    await video.save();

    const status = await getVideoStatus(video, userId);

    return res.status(200).json({
      success: true,

      message: isDisliked
        ? "Dislike removed successfully"
        : "Video disliked successfully",

      videoId: video._id,

      likeCount: video.likeCount,
      dislikeCount: video.dislikeCount,

      likedStatus: status.likedStatus,
      dislikedStatus: status.dislikedStatus,
      subscribe: status.subscribe,
    });
  } catch (err) {
    console.error("Dislike video error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to dislike video",
      error: err.message,
    });
  }
};


// DELETE VIDEO
const deleteVideo = async (req, res) => {
  try {
    const tokenData = getUserFromToken(req);

    if (!tokenData) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    if (
      video.uploadedBy.toString() !==
      tokenData._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this video",
      });
    }

    // Delete video from Cloudinary
    if (video.videoPublicId) {
      await cloudinary.uploader.destroy(
        video.videoPublicId,
        {
          resource_type: "video",
        }
      );
    }

    // Delete thumbnail
    if (video.thumbnailPublicId) {
      await cloudinary.uploader.destroy(
        video.thumbnailPublicId
      );
    }

    await Video.findByIdAndDelete(video._id);

    return res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (err) {
    console.error("Delete video error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to delete video",
      error: err.message,
    });
  }
};


module.exports = {
  upload,
  allVideo,
  getVideo,
  likeVideo,
  dislikeVideo,
  deleteVideo,
};