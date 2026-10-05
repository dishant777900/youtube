const express = require("express");

const router = express.Router();

const {
  upload,
  allVideo,
  getVideo,
  likeVideo,
  dislikeVideo,
  deleteVideo,
} = require("../controllers/videoController");


router.post("/upload", upload);
router.get("/all-video", allVideo);
router.get("/get-video/:id", getVideo);
router.post("/likeVideo/:videoId", likeVideo);
router.post("/dislikeVideo/:videoId", dislikeVideo);
router.delete("/deleteVideo/:videoId", deleteVideo);


module.exports = router;