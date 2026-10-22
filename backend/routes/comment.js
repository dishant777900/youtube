const express = require('express');
const router = express.Router();

const { addComment, getComments, likeComment, dislikeComment, deleteComment, updateComment } = require('../controllers/commentController');

router.post('/add-comment/:videoId', addComment);
router.get('/:videoId', getComments);
router.post('/likeComment/:commentId',likeComment)
router.post('/dislikeComment/:commentId',dislikeComment)
router.delete('/deleteComment/:commentId',deleteComment)
router.put('/updateComment/:commentId',updateComment)

module.exports = router;