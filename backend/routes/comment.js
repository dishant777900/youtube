const express = require("express");
const router = express.Router();

const {
  addComment,
  getComments,
  likeComment,
  dislikeComment,
  deleteComment,
  updateComment,
} = require("../controllers/commentController");

// Add comment
router.post("/add-comment/:videoId", addComment);

// Get all comments of a video
router.get("/:videoId", getComments);

// Like / Unlike comment
router.post("/likeComment/:commentId", likeComment);

// Dislike / Undislike comment
router.post("/dislikeComment/:commentId", dislikeComment);

// Delete comment
router.delete("/deleteComment/:commentId", deleteComment);

// Update comment
router.put("/updateComment/:commentId", updateComment);

module.exports = router;