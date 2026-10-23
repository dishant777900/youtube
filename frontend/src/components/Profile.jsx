import { useEffect, useRef, useState } from "react"
import axios from "axios"
import { Link, useNavigate, useParams } from "react-router-dom"
import swal from "sweetalert"
import profileImg from "../assets/profile.webp"

const daysAgo = (date) => {
  const days = Math.floor((Date.now() - new Date(date)) / (1000 * 60 * 60 * 24))
  return days > 0 ? `${days} day${days > 1 ? 's' : ''} ago` : "Today"
}

const Profile = () => {
  const api = import.meta.env.VITE_API_URL
  const navigate = useNavigate()
  const params = useParams()
  const token = localStorage.getItem('token')
  const myId = localStorage.getItem('userId')
  const channelId = params.id || myId
  const isOwner = Boolean(token) && channelId === myId

  const [user, setUser] = useState(null)
  const [videos, setVideos] = useState([])
  const [isLoading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [thumbTarget, setThumbTarget] = useState(null)
  const profileInput = useRef(null)
  const coverInput = useRef(null)
  const thumbInput = useRef(null)

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } }
  const showError = (err) => swal({
    text: (typeof err.response?.data?.error === 'string' && err.response.data.error) || err.response?.data?.msg || "Something is wrong!",
    icon: "error",
    button: "Ok",
  })

  useEffect(() => {
    if (!channelId) {
      navigate('/login')
      return
    }
    load()
  }, [channelId])

  const load = async () => {
    try {
      setLoading(true)
      const [u, v] = await Promise.all([
        axios.get(`${api}/user/profile/${channelId}`, token ? authHeaders : undefined),
        axios.get(`${api}/video/channel/${channelId}`),
      ])
      setUser(u.data.user)
      setVideos(v.data.videos || [])
    } catch (err) {
      setUser(null)
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  // profile photo (field "profile") / cover (field "coverPic")
  const uploadPicture = async (e, endpoint, field, urlKey) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      setBusy(true)
      const formData = new FormData()
      formData.append(field, file)
      const res = await axios.put(`${api}/user/${endpoint}`, formData, authHeaders)
      setUser(u => ({ ...u, [urlKey]: res.data[urlKey] }))
    } catch (err) {
      showError(err)
    } finally {
      setBusy(false)
    }
  }

  const toggleSubscribe = async () => {
    if (!token) return navigate('/login')
    try {
      await axios.put(`${api}/user/${user.isSubscribed ? 'unsubscribe' : 'subscribe'}/${user._id}`, {}, authHeaders)
      setUser(u => ({
        ...u,
        isSubscribed: !u.isSubscribed,
        subscribersCount: u.subscribersCount + (u.isSubscribed ? -1 : 1),
      }))
    } catch (err) {
      showError(err)
    }
  }

  const changeThumbnail = async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file || !thumbTarget) return
    try {
      setBusy(true)
      const formData = new FormData()
      formData.append('thumbnail', file)
      const res = await axios.put(`${api}/video/updateThumbnail/${thumbTarget}`, formData, authHeaders)
      setVideos(list => list.map(v => v._id === thumbTarget ? { ...v, thumbnailUrl: res.data.thumbnailUrl } : v))
    } catch (err) {
      showError(err)
    } finally {
      setBusy(false)
      setThumbTarget(null)
    }
  }

  const deleteVideo = async (videoId) => {
    try {
      const confirmed = await swal({
        title: "Delete this video?",
        text: "You won't be able to revert this!",
        icon: "warning",
        buttons: ["Cancel", "Yes, delete it!"],
        dangerMode: true,
      })
      if (!confirmed) return
      setBusy(true)
      await axios.delete(`${api}/video/delete/${videoId}`, authHeaders)
      setVideos(list => list.filter(v => v._id !== videoId))
      setUser(u => ({ ...u, videoCount: Math.max(0, u.videoCount - 1) }))
    } catch (err) {
      showError(err)
    } finally {
      setBusy(false)
    }
  }

  if (isLoading) {
    return <div className="videoLoader"><span><i className="fa-solid fa-spinner fa-spin-pulse"></i></span></div>
  }
  if (!user) {
    return <div className="pf-wrapper"><h2>Channel not found</h2></div>
  }

  return (
    <div className="pf-wrapper">
      <input ref={profileInput} type="file" accept="image/*" hidden onChange={(e) => uploadPicture(e, 'uploadProfile', 'profile', 'profilePicUrl')} />
      <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => uploadPicture(e, 'uploadCoverPic', 'coverPic', 'coverPicUrl')} />
      <input ref={thumbInput} type="file" accept="image/*" hidden onChange={changeThumbnail} />

      <div className="pf-cover" style={user.coverPicUrl ? { backgroundImage: `url(${user.coverPicUrl})` } : undefined}>
        {isOwner && <button type="button" className="pf-btn pf-btn-light" disabled={busy} onClick={() => coverInput.current.click()}>
          <i className="fa-solid fa-camera"></i> Change cover
        </button>}
      </div>

      <div className="pf-header">
        <div className="pf-avatar-wrap">
          <img className="pf-avatar" src={user.profilePicUrl || profileImg} alt="profile" />
          {isOwner && <button type="button" className="pf-avatar-edit" aria-label="Change profile picture" disabled={busy} onClick={() => profileInput.current.click()}>
            <i className="fa-solid fa-camera"></i>
          </button>}
        </div>
        <div className="pf-info">
          <h1>{user.channelName}</h1>
          <div className="pf-meta">
            {user.subscribersCount} subscribers · {user.videoCount} videos{isOwner && <> · {user.subscribedToCount} subscriptions</>}
          </div>
          <p className="pf-desc">{user.description}</p>
          <div className="pf-actions">
            {isOwner
              ? <Link to="/add-video" className="pf-btn pf-btn-dark">Upload video</Link>
              : <button type="button" className="pf-btn pf-btn-dark" onClick={toggleSubscribe}>{user.isSubscribed ? 'Unsubscribe' : 'Subscribe'}</button>}
          </div>
        </div>
      </div>

      <div className="pf-tab">Videos</div>

      {videos.length === 0
        ? <p className="pf-empty">{isOwner ? "You haven't uploaded any videos yet." : "This channel has no videos yet."}</p>
        : <div className="pf-grid">
          {videos.map(v => (
            <div className="pf-card" key={v._id}>
              <img className="pf-thumb" src={v.thumbnailUrl} alt="thumbnail" onClick={() => navigate(`/video/${v._id}`)} />
              <div className="pf-card-title" onClick={() => navigate(`/video/${v._id}`)}>{v.title}</div>
              <div className="pf-card-meta">{v.views || 0} views · {daysAgo(v.publishedAt)}</div>
              {isOwner && <div className="pf-card-actions">
                <button type="button" className="pf-btn pf-btn-light" disabled={busy} onClick={() => { setThumbTarget(v._id); thumbInput.current.click() }}>Change thumbnail</button>
                <button type="button" className="pf-btn pf-btn-danger" disabled={busy} onClick={() => deleteVideo(v._id)}>Delete</button>
              </div>}
            </div>
          ))}
        </div>}
    </div>
  )
}

export default Profile
