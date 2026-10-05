import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import profile from '../assets/profile.webp'
import swal from 'sweetalert'

const Video = () => {
  const [comment,setComment] = useState('')
  const [commentList,setCommentList] = useState([])
  const [commentLoading,setCommentLoading] = useState(false)
  const videoId = useParams()
  // console.log(videoId)
  const [video, setVideo] = useState({})


  const api = import.meta.env.VITE_API

  useEffect(() => {
    getVideoById()
    getComment()
  }, [])

  const subscribe = () => {
    console.log('subscribe')
  }

  const getVideoById = async () => {
    try {
      const d = await axios.get(`${api}/video/get-video/${videoId.id}`)
      console.log('video', d.data.video)
      setVideo(d.data.video)

    }
    catch (err) {
      console.log(err)
    }
  }

  const getComment = async()=>{
    try
    {
      console.log('comment list loading')
      const commentRes = await axios.get(`${api}/comment/getallcomment/${videoId.id}`)
      console.log(commentRes.data.comments)
      setCommentList(commentRes.data.comments.reverse())
    }
    catch(err)
    {
      console.log(err)
      swal( "Oops" ,  "Something went wrong!" ,  "error" )
    }
  }

  const addComment = async()=>{
    try
    {
      setCommentLoading(true)
      const commentRes = await axios.post(`${api}/comment/addcomment/${videoId.id}`,{commentText:comment},{
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      setCommentLoading(false)
      await swal("New Comment!", "New Comment Added!", "success");
      setComment('')
      getComment()
    }
    catch(err)
    {
      setCommentLoading(false)
      console.log(err)
      swal( "Oops" ,  "Something went wrong!" ,  "error" )
    }

  }
  return (
    <div className='video'>
      {video.videoUrl && <div className='video-left'>
        <video src={video.videoUrl} controls className='video-player'>

        </video>
        <h1 className='video-title'>{video.title}</h1>
        <p>{video.views} views, {video.likes} likes</p>
        <div className='video-user-wrapper'>
          <div className='channel-info'>
            <img className='user-profile' src={video.uploadedBy.profilePicUrl ? video.uploadedBy.profilePicUrl : profile} />
            <div>
              <p className='channelName'>{video.uploadedBy.channelName}</p>
              <p>{video.uploadedBy.subscriber.length} Subscribers</p>
            </div>
          </div>
          {video.uploadedBy._id != localStorage.getItem('userId') && <div className='like-dislike-subscrib-wrapper'>
            <span className='like-dislike'><i className="fa-regular fa-thumbs-up"></i></span>
            <span className='like-dislike'><i className="fa-solid fa-thumbs-up"></i></span>
            <span className='like-dislike'><i className="fa-regular fa-thumbs-down"></i></span>
            <span className='like-dislike'><i className="fa-solid fa-thumbs-down"></i></span>
            <button onClick={subscribe} className='subscribe-btn' type='button'><i className="fa-regular fa-bell"></i> Subscribe</button>
          </div>
          }
        </div>
        <div
          dangerouslySetInnerHTML={{
            __html: video.description
          }}
        />
        <hr/>
        <div className='comment-wrapper'>
          <input onChange={(e)=>{setComment(e.target.value)}} value={comment} className='comment-box' type="text" placeholder='write comment'/>
          <button onClick={addComment} className='comment-btn' type='button'>{commentLoading && <span><i className="fa-solid fa-spinner fa-spin-pulse"></i></span>} Comment</button>
        </div>
        <div className='commentList-wrapper'>
          {
            commentList.map(comment=>(
              <div className='comment-card' key={comment._id}>
                <div className='comment-user-info'>
                  <img className='user-profile' src={comment.userId.profilePicUrl ? comment.userId.profilePicUrl : profile} />
                  <p>{comment.userId.channelName}</p>
                </div>
                <p className='commentText'>{comment.commentText}</p>
              </div>
            ))
          }
        </div>
      </div>}
      <div className='video-right'>

      </div>
    </div>
  )
}

export default Video