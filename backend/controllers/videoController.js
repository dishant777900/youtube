const cloudinary = require('../config/cloudinary')
const jwt = require('jsonwebtoken')
const Video = require('../models/Video')

// upload video
const upload = async(req,res)=>{
    try
    {
        const token = req.headers.authorization.split(" ")[1]
        const tokenData = jwt.verify(token, process.env.SEC_KEY)
        console.log(req.files)
        const uploadedVideo = await cloudinary.uploader.upload(req.files.video.tempFilePath,{
            resource_type:'video',
            folder:'sbstube/video'
        })

        const uploadedThumbnail = await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath,{
            resource_type:'image',
            folder:'sbstube/thumbnail'
        })

        const newVideo = new Video({
            title:req.body.title,
            description:req.body.description,
            videoUrl:uploadedVideo.secure_url,
            videoPublicId:uploadedVideo.public_id,
            thumbnailUrl:uploadedThumbnail.secure_url,
            thumbnailPublicId:uploadedThumbnail.public_id,
            uploadedBy:tokenData._id
        })

        const newUploadedVideo = await newVideo.save()
        res.status(200).json({
            newVideo:newUploadedVideo
        })
    }
    catch(err)
    {
        console.log(err)
        res.status(500).json({
            error:err
        })
    }
}

// get all video
const allVideo = async (req, res) => {
    try {

        const allvideos = await Video.find()
            .select("_id title thumbnailUrl uploadedBy publishedAt")
            .populate(
                "uploadedBy",
                "channelName profilePicUrl"
            );

        res.status(200).json({
            videos: allvideos
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: err.message
        });
    }
};

// get video by id
const getVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id)
            .populate("uploadedBy", "channelName profilePicUrl subscribers");

        if (!video) {
            return res.status(404).json({
                message: "Video not found"
            });
        }

        // Increase views
        video.views += 1;
        await video.save();

        // Default: user has not liked the video
        let isLiked = false;

        // Check token if available
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            try {
                const token = authHeader.split(" ")[1];

                const tokenData = jwt.verify(
                    token,
                    process.env.SEC_KEY
                );

                const userId = tokenData._id;

                // Check whether current user liked this video
                isLiked = video.likedBy.some(
                    id => id.toString() === userId.toString()
                );

            } catch (tokenError) {
                // Invalid/expired token
                isLiked = false;
            }
        }

        const newResponse = {
            ...video._doc,
            subscribersCount: video.uploadedBy.subscribers.length,
            isLiked: isLiked
        };

        res.status(200).json({
            video: newResponse
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
};


// like / unlike video
const likeVideo = async (req, res) => {
    try {

        const video = await Video.findById(req.params.videoId);

        if (!video) {
            return res.status(404).json({
                msg: "Video not found"
            });
        }

        // Check whether token is provided
        const authHeader = req.headers.authorization;

        // no token

        if (!authHeader || !authHeader.startsWith("Bearer ")) {

            return res.status(200).json({
                msg: "Login required to like video",

                video: video,

                likedStatus: false,
                dislikedStatus: false,
                subscribe: false
            });
        }

        // with token

        const token = authHeader.split(" ")[1];

        const tokenData = jwt.verify(
            token,
            process.env.SEC_KEY
        );

        const userId = tokenData._id;

        const isLiked = video.likedBy.some(
            id => id.toString() === userId.toString()
        );

        const isDisliked = video.dislikedBy.some(
            id => id.toString() === userId.toString()
        );

        if (isLiked) {

            // Unlike
            video.likedBy = video.likedBy.filter(
                id => id.toString() !== userId.toString()
            );

            video.likeCount--;

        } else {

            // Remove dislike if already disliked
            if (isDisliked) {

                video.dislikedBy = video.dislikedBy.filter(
                    id => id.toString() !== userId.toString()
                );

                video.dislikeCount--;
            }

            // Like
            video.likedBy.push(userId);
            video.likeCount++;
        }

        await video.save();

        // Status after operation
        const updatedLikedStatus = !isLiked;

        res.status(200).json({

            msg: updatedLikedStatus
                ? "Video liked successfully"
                : "Video unliked successfully",

            video: video,

            likeCount: video.likeCount,
            dislikeCount: video.dislikeCount,

            likedStatus: updatedLikedStatus,

            // If video is liked, it cannot be disliked
            dislikedStatus: false,

            subscribe: false
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: err.message
        });
    }
};

const dislikeVideo = async (req, res) => {
    try {

        const video = await Video.findById(req.params.videoId);

        if (!video) {
            return res.status(404).json({
                msg: "Video not found"
            });
        }

        // Check whether token is provided
        const authHeader = req.headers.authorization;

        // no token
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {

            return res.status(200).json({
                msg: "Login required to dislike video",

                video: video,

                likedStatus: false,
                dislikedStatus: false,
                subscribe: false
            });
        }

        // with token

        const token = authHeader.split(" ")[1];

        const tokenData = jwt.verify(
            token,
            process.env.SEC_KEY
        );

        const userId = tokenData._id;

        // Check current status
        const isDisliked = video.dislikedBy.some(
            id => id.toString() === userId.toString()
        );

        const isLiked = video.likedBy.some(
            id => id.toString() === userId.toString()
        );

        if (isDisliked) {

            // Remove dislike
            video.dislikedBy = video.dislikedBy.filter(
                id => id.toString() !== userId.toString()
            );

            video.dislikeCount--;

        } else {

            // Remove like if already liked
            if (isLiked) {

                video.likedBy = video.likedBy.filter(
                    id => id.toString() !== userId.toString()
                );

                video.likeCount--;
            }

            // Add dislike
            video.dislikedBy.push(userId);
            video.dislikeCount++;
        }

        await video.save();

        // Updated status after operation
        const updatedDislikedStatus = !isDisliked;

        res.status(200).json({

            msg: updatedDislikedStatus
                ? "Video disliked successfully"
                : "Dislike removed successfully",

            video: video,

            likeCount: video.likeCount,
            dislikeCount: video.dislikeCount,

            likedStatus: false,

            dislikedStatus: updatedDislikedStatus,

            subscribe: false
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: err.message
        });
    }
};

// update thubmnail url
const updateThumbnail = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const tokenData = jwt.verify(token, process.env.SEC_KEY);

        const video = await Video.findById(req.params.videoId);

        if (!video) {
            return res.status(404).json({
                msg: "Video not found"
            });
        }

        // Only the owner can update the thumbnail
        if (video.uploadedBy.toString() !== tokenData._id) {
            return res.status(403).json({
                msg: "You are not authorized to update this thumbnail"
            });
        }

        if (!req.files || !req.files.thumbnail) {
            return res.status(400).json({
                msg: "Thumbnail is required"
            });
        }

        // Delete old thumbnail from Cloudinary
        if (video.thumbnailPublicId) {
            await cloudinary.uploader.destroy(video.thumbnailPublicId);
        }

        // Upload new thumbnail
        const uploadedThumbnail = await cloudinary.uploader.upload(
            req.files.thumbnail.tempFilePath,
            {
                resource_type: "image",
                folder: "sbstube/thumbnail"
            }
        );

        // Update database
        video.thumbnailUrl = uploadedThumbnail.secure_url;
        video.thumbnailPublicId = uploadedThumbnail.public_id;

        await video.save();

        res.status(200).json({
            msg: "Thumbnail updated successfully",
            thumbnailUrl: video.thumbnailUrl
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message
        });
    }
}

//delete video
const deleteVideo = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const tokenData = jwt.verify(token, process.env.SEC_KEY);

        const video = await Video.findById(req.params.videoId);

        if (!video) {
            return res.status(404).json({
                msg: "Video not found"
            });
        }

        // Check ownership
        if (video.uploadedBy.toString() !== tokenData._id.toString()) {
            return res.status(403).json({
                msg: "You are not authorized to delete this video"
            });
        }

        // Delete video from Cloudinary
        await cloudinary.uploader.destroy(video.videoPublicId, {
            resource_type: "video"
        });

        // Delete thumbnail from Cloudinary
        if (video.thumbnailPublicId) {
            await cloudinary.uploader.destroy(video.thumbnailPublicId);
        }

        // Delete video from MongoDB
        await Video.findByIdAndDelete(req.params.videoId);

        res.status(200).json({
            msg: "Video deleted successfully"
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message
        });
    }
};

module.exports = {upload,allVideo,getVideo,likeVideo,dislikeVideo,updateThumbnail,deleteVideo}