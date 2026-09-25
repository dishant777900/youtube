const mongoose = require('mongoose')
const { video } = require('../config/cloudinary')

const commentSchema = new mongoose.Schema({
    videoId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'video',
        required:true
    },

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    
    commentText:{
        type:String,
        required:true,
        trim:true
    },

    likedBy:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    }],

    dislikedBy:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    }],

    likeCount:{
        type:Number,
        default:0,
        min:0
    },

    dislikedCount:{
        type:Number,
        default:0,
        min:0
    },

    publishedAt:{
        type:Date,
        default:Date.now
    },

},
{
    timestamps:true
})