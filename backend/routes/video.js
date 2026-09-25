const express = require('express');
const router = express.Router();

const { upload, allVideo, getVideo, likeVideo, dislikeVideo, updateThumbnail, deleteVideo } = require('../controllers/videoController');

router.post('/upload', upload);
router.get('/allVideo',allVideo)
router.get('/get-video/:id', getVideo);
router.post('/likeVideo/:videoId',likeVideo)
router.post('/dislike/:videoId',dislikeVideo)
router.put('/updateThumbnail/:videoId',updateThumbnail)
router.delete('/delete/:videoId',deleteVideo)

module.exports = router;