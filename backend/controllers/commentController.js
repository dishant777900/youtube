const Comment = require("../models/Comment");
const Video = require("../models/Video");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Get logged-in user from token
const getUserFromToken = (req) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return null;
    }

    return jwt.verify(token, process.env.SEC_KEY);
  } catch (error) {
    return null;
  }
};

// Add Comment
const addComment = async (req, res) => {
  try {
    const tokenData = getUserFromToken(req);

    if (!tokenData) {
      return res.status(401).json({
        success: false,
        message: "Login required to comment",
      });
    }

    const { videoId } = req.params;
    const { commentText } = req.body;

    if (!commentText || !commentText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const comment = new Comment({
      commentText: commentText.trim(),
      userId: tokenData._id,
      videoId: videoId,
    });

    await comment.save();

    await comment.populate(
      "userId",
      "channelName profilePicUrl"
    );

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: comment,
    });
  } catch (error) {
    console.log("Add comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: error.message,
    });
  }
};

// Get Comments
const getComments = async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const comments = await Comment.find({ videoId })
      .populate("userId", "channelName profilePicUrl")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Comments fetched successfully",
      count: comments.length,
      data: comments,
    });
  } catch (error) {
    console.log("Get comments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
      error: error.message,
    });
  }
};

// Like Comment
const likeComment = async (req, res) => {
  try {
    const tokenData = getUserFromToken(req);

    if (!tokenData) {
      return res.status(401).json({
        success: false,
        message: "Login required to like a comment",
      });
    }

    const userId = tokenData._id;
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const isLiked = comment.likedBy.some(
      (id) => id.toString() === userId.toString()
    );

    const isDisliked = comment.dislikedBy.some(
      (id) => id.toString() === userId.toString()
    );

    if (isLiked) {
      // Unlike
      comment.likedBy = comment.likedBy.filter(
        (id) => id.toString() !== userId.toString()
      );

      comment.likeCount = Math.max(0, comment.likeCount - 1);
    } else {
      // Like
      comment.likedBy.push(userId);
      comment.likeCount += 1;

      // Remove dislike if previously disliked
      if (isDisliked) {
        comment.dislikedBy = comment.dislikedBy.filter(
          (id) => id.toString() !== userId.toString()
        );

        comment.dislikeCount = Math.max(
          0,
          comment.dislikeCount - 1
        );
      }
    }

    await comment.save();

    return res.status(200).json({
      success: true,
      message: isLiked
        ? "Comment unliked successfully"
        : "Comment liked successfully",
      likeCount: comment.likeCount,
      dislikeCount: comment.dislikeCount,
      likedStatus: !isLiked,
      dislikedStatus: false,
    });
  } catch (error) {
    console.log("Like comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to like comment",
      error: error.message,
    });
  }
};

// Dislike Comment
const dislikeComment = async (req, res) => {
  try {
    const tokenData = getUserFromToken(req);

    if (!tokenData) {
      return res.status(401).json({
        success: false,
        message: "Login required to dislike a comment",
      });
    }

    const userId = tokenData._id;
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const isDisliked = comment.dislikedBy.some(
      (id) => id.toString() === userId.toString()
    );

    const isLiked = comment.likedBy.some(
      (id) => id.toString() === userId.toString()
    );

    if (isDisliked) {
      // Remove dislike
      comment.dislikedBy = comment.dislikedBy.filter(
        (id) => id.toString() !== userId.toString()
      );

      comment.dislikeCount = Math.max(
        0,
        comment.dislikeCount - 1
      );
    } else {
      // Add dislike
      comment.dislikedBy.push(userId);
      comment.dislikeCount += 1;

      // Remove like if previously liked
      if (isLiked) {
        comment.likedBy = comment.likedBy.filter(
          (id) => id.toString() !== userId.toString()
        );

        comment.likeCount = Math.max(
          0,
          comment.likeCount - 1
        );
      }
    }

    await comment.save();

    return res.status(200).json({
      success: true,
      message: isDisliked
        ? "Comment undisliked successfully"
        : "Comment disliked successfully",
      likeCount: comment.likeCount,
      dislikeCount: comment.dislikeCount,
      likedStatus: false,
      dislikedStatus: !isDisliked,
    });
  } catch (error) {
    console.log("Dislike comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to dislike comment",
      error: error.message,
    });
  }
};

// Delete Comment
const deleteComment = async (req, res) => {
  try {
    const tokenData = getUserFromToken(req);

    if (!tokenData) {
      return res.status(401).json({
        success: false,
        message: "Login required to delete a comment",
      });
    }

    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const video = await Video.findById(comment.videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const userId = tokenData._id.toString();
    const commenterId = comment.userId.toString();
    const videoOwnerId = video.uploadedBy.toString();

    // Only comment owner OR video owner can delete
    if (userId !== commenterId && userId !== videoOwnerId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this comment",
      });
    }

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.log("Delete comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete comment",
      error: error.message,
    });
  }
};

// Update Comment
const updateComment = async (req, res) => {
  try {
    const tokenData = getUserFromToken(req);

    if (!tokenData) {
      return res.status(401).json({
        success: false,
        message: "Login required to update a comment",
      });
    }

    const { commentId } = req.params;
    const { commentText } = req.body;

    if (!commentText || !commentText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (
      comment.userId.toString() !==
      tokenData._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this comment",
      });
    }

    comment.commentText = commentText.trim();

    await comment.save();

    await comment.populate(
      "userId",
      "channelName profilePicUrl"
    );

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: comment,
    });
  } catch (error) {
    console.log("Update comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update comment",
      error: error.message,
    });
  }
};

module.exports = {
  addComment,
  getComments,
  likeComment,
  dislikeComment,
  deleteComment,
  updateComment,
};