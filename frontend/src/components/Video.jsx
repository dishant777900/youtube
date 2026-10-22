import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import swal from "sweetalert"
import profile from "../assets/profile.webp"

const Video = () => {


  useEffect(() => {
    getVideo();
    getComment()
  }, [])

  const [isLoading, setLoading] = useState(true)
  const [commentLoading, setcommentLoading] = useState(false)
  const [comment, setComment] = useState("")
  const [commentList, setCommentList] = useState([])
  const [isSubscribe, setSubscribe] = useState(false)
  const [isLike, setLike] = useState(false)
  const [isDislike, setDislike] = useState(false)

  const videoId = useParams()
  const [video, setVideo] = useState({})
  const api_base_url = import.meta.env.VITE_API_URL
  const navigate = useNavigate()
  const navigateToLogin = () => navigate("/login")

  // const navigateToLogin=()=>{
  //     navigate('/login')
  // }

  const token = localStorage.getItem('token')
  const userId = localStorage.getItem('userId')
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } }
  const showError = (err) => swal({
    text: (typeof err.response?.data?.error === 'string' && err.response.data.error) || err.response?.data?.msg || "Something is wrong!",
    icon: "error",
    button: "Ok",
  })

  const getVideo = async () => {
    try {
      setLoading(true)
      const d = await axios.get(`${api_base_url}/video/get-video/${videoId.id}`,
        token ? authHeaders : undefined)
      const v = d.data.video
      setVideo(v)
      // backend returns raw arrays/ids, so derive the user's state from them
      setSubscribe((v.uploadedBy?.subscribers || []).some(id => String(id) === userId))
      setLike(Boolean(v.isLiked))
      setDislike((v.dislikedBy || []).some(id => String(id) === userId))
      setLoading(false)
    }
    catch (err) {
      setLoading(false)
      console.log(err);
    }
  }

  const subscribe = async (channelId) => {
    if (!token) return navigateToLogin()
    const wasSubscribed = isSubscribe
    try {
      await axios.put(`${api_base_url}/user/${wasSubscribed ? 'unsubscribe' : 'subscribe'}/${channelId}`, {}, authHeaders)
      setSubscribe(!wasSubscribed)
      setVideo(v => ({ ...v, subscribersCount: Math.max(0, (v.subscribersCount || 0) + (wasSubscribed ? -1 : 1)) }))
    }
    catch (err) {
      showError(err)
    }
  }

  // like / dislike responses: { likeCount, dislikeCount, likedStatus, dislikedStatus }
  const applyReaction = (data) => {
    setLike(Boolean(data.likedStatus))
    setDislike(Boolean(data.dislikedStatus))
    setVideo(v => ({ ...v, likeCount: data.likeCount, dislikeCount: data.dislikeCount }))
  }

  const likeHandler = async () => {
    if (!token) return navigateToLogin()
    try {
      const res = await axios.post(`${api_base_url}/video/likeVideo/${videoId.id}`, {}, authHeaders)
      applyReaction(res.data)
    }
    catch (err) {
      showError(err)
    }
  }

  const dislikeHandler = async () => {
    if (!token) return navigateToLogin()
    try {
      const res = await axios.post(`${api_base_url}/video/dislike/${videoId.id}`, {}, authHeaders)
      applyReaction(res.data)
    }
    catch (err) {
      showError(err)
    }
  }

  const addComment = async () => {
    if (!token) return navigateToLogin()
    if (!comment.trim()) return
    try {
      setcommentLoading(true)
      await axios.post(`${api_base_url}/comment/add-comment/${videoId.id}`, { comment }, authHeaders)
      setcommentLoading(false)
      setComment('')
      getComment()
    }
    catch (err) {
      setcommentLoading(false)
      showError(err)
    }
  }

  const getComment = async () => {
    try {
      const commentRes = await axios.get(`${api_base_url}/comment/${videoId.id}`)
      setCommentList((commentRes.data.data || []).slice().reverse())
    }
    catch (err) {
      console.log(err)
    }
  }

  // The backend only returns a comment's userId (if selected); support both id and populated object
  const commenterId = (c) => String(c.userId?._id || c.userId || '')

  // Comment like/dislike responses: { likescount } / { dislikeCount }
  const likeCommentHandler = async (commentId) => {
    if (!token) return navigateToLogin()
    try {
      const res = await axios.post(`${api_base_url}/comment/likeComment/${commentId}`, {}, authHeaders)
      setCommentList(list => list.map(c => c._id !== commentId ? c : {
        ...c,
        isLike: !c.isLike,
        isDislike: false,
        likeCount: res.data.likescount ?? res.data.likeCount ?? c.likeCount,
      }))
    }
    catch (err) {
      showError(err)
    }
  }

  const dislikeCommentHandler = async (commentId) => {
    if (!token) return navigateToLogin()
    try {
      const res = await axios.post(`${api_base_url}/comment/dislikeComment/${commentId}`, {}, authHeaders)
      setCommentList(list => list.map(c => c._id !== commentId ? c : {
        ...c,
        isDislike: !c.isDislike,
        isLike: false,
        dislikeCount: res.data.dislikeCount ?? c.dislikeCount,
      }))
    }
    catch (err) {
      showError(err)
    }
  }

  const deleteComment = async (commentId) => {
    try {
      const confirmed = await swal({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        buttons: ["Cancel", "Yes, delete it!"],
        dangerMode: true,
      })
      if (!confirmed) return
      await axios.delete(`${api_base_url}/comment/deleteComment/${commentId}`, authHeaders)
      getComment()
    }
    catch (err) {
      showError(err)
    }
  }

  const editComment = async (c) => {
    try {
      const text = await swal({
        text: "Edit your comment",
        content: { element: "input", attributes: { defaultValue: c.commentText } },
        buttons: ["Cancel", "Save"],
      })
      if (!text || !text.trim() || text === c.commentText) return
      await axios.put(`${api_base_url}/comment/updateComment/${c._id}`, { comment: text }, authHeaders)
      setCommentList(list => list.map(x => x._id === c._id ? { ...x, commentText: text } : x))
    }
    catch (err) {
      showError(err)
    }
  }

  return (
    <div className="video">
      {
        isLoading ? <div className="videoLoader"><span> <i className="fa-solid fa-spinner fa-spin-pulse"></i></span> </div>
          :
          <div className='video-left'>  <video src={video.videoUrl} controls className='video-player'></video>
            <h1 className='video-title'>{video.title}</h1>
            <p>{video.views} views, {video.likeCount} likes, {video.dislikeCount || 0} dislikes</p>
            <div className='video-user-wrapper'>
              <div className='channel-info'>
                <img className="user-profile" src={video.uploadedBy?.profilePicUrl ? video.uploadedBy.profilePicUrl : profile} />
                <div>
                  <p className='channelName'>{video.uploadedBy?.channelName}</p>
                  <p>{video.subscribersCount || 0} subscribers</p>
                </div>
              </div>
              {video.uploadedBy?._id != userId && token && <div className='like-dislike-subscribe-wrapper'>
                {!isLike && <span className='like-dislike' onClick={likeHandler}><i className="fa-regular fa-thumbs-up"></i></span>}
                {isLike && <span className='like-dislike' onClick={likeHandler} ><i className="fa-solid fa-thumbs-up"></i></span>}
                {!isDislike && <span className='like-dislike' onClick={dislikeHandler} ><i className="fa-regular fa-thumbs-down"></i></span>}
                {isDislike && <span className='like-dislike' onClick={dislikeHandler}><i className="fa-solid fa-thumbs-down"></i></span>}
                <button className='subscribe-btn' type='button' onClick={() => {
                  subscribe(video.uploadedBy?._id)
                }}>{!isSubscribe && <span><i className="fa-regular fa-bell"></i></span>}{!isSubscribe ? 'Subscribe' : 'Unsubscribe'}</button>
              </div>

              }
            </div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{video.description}</p>
            <hr />
            {token ? <div className='comment-wrapper'>
              <input onChange={(e) => { setComment(e.target.value) }} value={comment} className='comment-box' type="text" placeholder='write comment' />
              <button onClick={addComment} className='comment-btn' type='button'>{commentLoading && <span><i className="fa-solid fa-spinner fa-spin-pulse"></i></span>} Comment</button>
            </div> :
              <h3><br></br>Comments</h3>}

            <div className='commentList-wrapper'>
              {
                commentList.map((c) => {
                  return <div className='comment-card' key={c._id}>
                    {/* {console.log(c)} */}
                   
                    
                    <div className='comment-user-info'>
                      <img className='user-profile' src={c.userId?.profilePicUrl ? c.userId.profilePicUrl : profile} />
                      <p>{c.userId?.channelName || "User"}</p>
                    </div>

                    <p className='commentText'>{c.commentText}</p>
                    <p>{new Date(c.publishedAt).toLocaleDateString()}</p>

                    <div className='like-dislike-subscribe-wrapper'>
                      <span className='like-dislike' onClick={() => { likeCommentHandler(c._id) }}><i className={`${c.isLike ? 'fa-solid' : 'fa-regular'} fa-thumbs-up`}></i> {c.likeCount || 0}</span>
                      <span className='like-dislike' onClick={() => { dislikeCommentHandler(c._id) }}><i className={`${c.isDislike ? 'fa-solid' : 'fa-regular'} fa-thumbs-down`}></i> {c.dislikeCount || 0}</span>
                      {token && commenterId(c) === userId && <span onClick={() => { editComment(c) }}><i className="fa-solid fa-pen"></i></span>}
                      {token && (commenterId(c) === userId || video.uploadedBy?._id === userId) && <span onClick={() => { deleteComment(c._id) }}><i className="fa-regular fa-trash-can"></i></span>}
                    </div>

                  </div>
                })
              }
            </div>
          </div>
      }
      <div className='video-right'>

      </div>
    </div>


  )

}
export default Video

