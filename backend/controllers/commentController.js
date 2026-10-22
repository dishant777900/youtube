const Comment = require('../models/Comment');
const jwt = require('jsonwebtoken');
const Video = require('../models/Video');

// Add comment
const addComment = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const tokenData = jwt.verify(token, process.env.SEC_KEY);

        const comment = new Comment({
            commentText: req.body.comment,
            userId: tokenData._id,
            videoId: req.params.videoId
        });

        const newComment = await comment.save();

        res.status(200).json({
            msg: "Comment added",
            data: newComment
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message
        });
    }
};

// Get comments
const getComments = async (req, res) => {
    try {
        const comments = await Comment.find({
            videoId: req.params.videoId
        })
            .select("commentText likeCount dislikeCount publishedAt userId")
            .populate("userId", "channelName profilePicUrl");

        res.status(200).json({
            data: comments
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message
        });
    }
};

// like Comment
const likeComment = async(req,res)=>{
    try
     {
        const token = req.headers.authorization.split(" ")[1]
        const tokenData = await jwt.verify(token,process.env.SEC_KEY)  
        const comment = await Comment.findById(req.params.commentId)
        //console.log(comment)
        const userId = tokenData._id

        const IsLiked = comment.likedBy.some(id => id.toString() === userId.toString())
        //console.log(IsLiked)
        if (IsLiked)
        {
            //unlike
            comment.likedBy = comment.likedBy.filter(uId => uId.toString() !== userId.toString())
            comment.likeCount -=1
            //console.log('unlike hua')
        }
        else
        {
            //like
            comment.likedBy.push(userId)
            comment.likeCount +=1
            if (comment.dislikedBy.some(id => id.toString() === userId.toString())) {
                comment.dislikedBy = comment.dislikedBy.filter(id => id.toString() !== userId.toString())
                comment.dislikeCount = Math.max(0, comment.dislikeCount - 1)
            }
            //console.log('like hua')
        }
        //console.log('hiiiiiii')
        await comment.save()

        res.status(200).json({
            likescount : comment.likeCount
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error:err
        })
    }
}

// dislike Comment
const dislikeComment = async(req,res)=>{
    try
    {
        const token = req.headers.authorization.split(" ")[1]
        const tokenData = await jwt.verify(token,process.env.SEC_KEY) 
        const userid = tokenData._id

        const comment = await Comment.findById(req.params.commentId)
        console.log(comment)

        const Isdislike = comment.dislikedBy.some(id => id.toString() === userid.toString())
        if(Isdislike)
        {
            //remove dislike
            comment.dislikedBy = comment.dislikedBy.filter(uId => uId.toString() !== userid.toString())
            comment.dislikeCount -=1
        }
        else
        {
            //dislike
            comment.dislikedBy.push(userid)
            comment.dislikeCount +=1
            if (comment.likedBy.some(id => id.toString() === userid.toString())) {
                comment.likedBy = comment.likedBy.filter(id => id.toString() !== userid.toString())
                comment.likeCount = Math.max(0, comment.likeCount - 1)
            }
        }

        await comment.save()
        res.status(200).json({
            dislikeCount : comment.dislikeCount
        })
    }
    catch(err)
    {
        console.log(err)
        res.status(500).json({
            error : err
        })
    }
}

// delete comment
const deleteComment = async(req,res)=>{
     try
    {
        const token = req.headers.authorization.split(" ")[1]
        const tokenData = await jwt.verify(token,process.env.SEC_KEY)

        const comment = await Comment.findById(req.params.commentId)
        const video = await Video.findById(comment.videoId)

        //console.log(tokenData._id)
        //console.log(video)
        const tokenUserId = tokenData._id
        const commenterId = comment.userId
        const videoOwnerId = video.uploadedBy

        //console.log('video ka owner', videoOwnerId)
        //console.log('comment krne vala ka id ', commenterId)        
        if (commenterId.toString() != tokenUserId.toString() && videoOwnerId.toString() != tokenUserId.toString())
        {
            console.log('hi',commenterId != tokenUserId)
            console.log('hello',videoOwnerId != tokenUserId)
            return res.status(500).json({
                msg : 'not authorized'
            })
        }

        await Comment.findByIdAndDelete(req.params.commentId)
        res.status(200).json({
            msg : 'msg deleted successfully'
        })
    }
    catch(err)
    {
        console.log(err)
        res.status(500).json({
            error : err
        })
    }
}

// update comment
const updateComment = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const tokenData = jwt.verify(token, process.env.SEC_KEY);

        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({
                msg: "Comment not found"
            });
        }

        // Only the comment owner can update the comment
        if (comment.userId.toString() !== tokenData._id.toString()) {
            return res.status(403).json({
                msg: "You are not authorized to update this comment"
            });
        }

        comment.commentText = req.body.comment;
        await comment.save();

        res.status(200).json({
            msg: "Comment updated successfully",
            data: comment
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message
        });
    }
}

module.exports = {
    addComment,
    getComments,
    likeComment,
    dislikeComment,
    deleteComment,
    updateComment
};