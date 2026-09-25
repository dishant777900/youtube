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
const allVideo = async(req,res)=>{
    try{
        const allvideos=await Video.find().select("_id title thumbnailUrl userId  publishedAt").populate('userId',"fullName imageUrl")
    res.status(200).json({
      videos:allVideos
    })
    }
    catch(err){
        console.log(err)
    res.status(500).json({
      error:err
    })
    }
}

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

        video.views += 1;
        await video.save();

        const newResponse = {
            ...video._doc,
            subscribersCount: video.uploadedBy.subscribers.length
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
}

//like unlike video
const likeVideo = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const tokenData = jwt.verify(token, process.env.SEC_KEY);

        const userId = tokenData._id;

        const video = await Video.findById(req.params.videoId);

        if (!video) {
            return res.status(404).json({
                msg: "Video not found"
            });
        }

        const isLiked = video.likedBy.includes(userId);

        if (isLiked) {
            // Unlike
            video.likedBy = video.likedBy.filter(
                id => id.toString() !== userId.toString()
            );
            video.likeCount--;
        } else {
            // Remove dislike if already disliked
            if (video.dislikedBy.includes(userId)) {
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

        res.status(200).json({
            msg: isLiked ? "Video unliked successfully" : "Video liked successfully",
            likeCount: video.likeCount,
            dislikeCount: video.dislikeCount
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message
        });
    }
}

//dislike and remove dislike
const dislikeVideo = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const tokenData = jwt.verify(token, process.env.SEC_KEY);

        const userId = tokenData._id;

        const video = await Video.findById(req.params.videoId);

        if (!video) {
            return res.status(404).json({
                msg: "Video not found"
            });
        }

        const isDisliked = video.dislikedBy.includes(userId);

        if (isDisliked) {
            // Remove dislike
            video.dislikedBy = video.dislikedBy.filter(
                id => id.toString() !== userId.toString()
            );
            video.dislikeCount--;
        } else {
            // Remove like if already liked
            if (video.likedBy.includes(userId)) {
                video.likedBy = video.likedBy.filter(
                    id => id.toString() !== userId.toString()
                );
                video.likeCount--;
            }

            // Dislike
            video.dislikedBy.push(userId);
            video.dislikeCount++;
        }

        await video.save();

        res.status(200).json({
            msg: isDisliked ? "Dislike removed successfully" : "Video disliked successfully",
            likeCount: video.likeCount,
            dislikeCount: video.dislikeCount
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message
        });
    }
}

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