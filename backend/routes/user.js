const express = require("express");

const router = express.Router();

const {
  signup,
  login,
  getProfile,
  subscribe,
  unsubscribe,
  uploadProfile,
  uploadCoverProfilePic,
} = require("../controllers/userController");


router.post("/signup", signup);
router.post("/login", login);
router.get("/profile", getProfile);
router.put("/subscribe/:channelId", subscribe);
router.put("/unsubscribe/:channelId", unsubscribe);
router.put("/uploadProfile", uploadProfile);
router.put("/uploadCoverPic", uploadCoverProfilePic);


module.exports = router;