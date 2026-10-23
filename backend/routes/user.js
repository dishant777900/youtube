const express = require('express')
const router = express.Router()
const {signup,
    login,
    subscribe,
    unsubscribe,
    uploadProfile,
    uploadCoverProfilePic,
    getProfile
} = require('../controllers/userController')

router.post('/signup',signup)
router.post('/login',login)
router.put('/subscribe/:channelId',subscribe)
router.put('/unsubscribe/:channelId',unsubscribe)
router.put('/uploadProfile',uploadProfile)
router.put('/uploadCoverPic',uploadCoverProfilePic)
router.get('/profile/:id', getProfile)

module.exports = router