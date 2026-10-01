import axios from 'axios'
import React, { useEffect, useState } from 'react'
import profile from '../assets/profile.webp'
import { useNavigate } from 'react-router-dom'


const Home = () => {
  const [videos, setVideos] = useState([])
  const api = import.meta.env.VITE_API

  const navigate = useNavigate();

  useEffect(() => {
    getVideo()
  }, [])

  const getVideo = async () => {
    const res = await axios.get(`${api}/video/allVideo`)
    console.log(res.data.videos)
    setVideos(res.data.videos.reverse())

  }
  return (
    <div className='home-wrapper'>
      <div className='video-wrapper'>
        {
          videos.map(video => (
            <div onClick={()=>{navigate(`video/${video._id}`,{
              state:video
            })}} className='video-card' key={video._id}>
              <img className='video-thumbnail' src={video.thumbnailUrl} alt="thumbnail" />
              <div className='video-detail'>
                <h1>{video.title}</h1>
                <div
                  dangerouslySetInnerHTML={{
                    __html: video.description
                  }}
                />
                <div>
                  <div className='profile-box'>
                    <img className='user-profile' src={video.uploadedBy.profilePicUrl ? video.uploadedBy.profilePicUrl : profile} alt="profile" />
                  <p>{video.uploadedBy.channelName}</p>
                  </div>
                  {/* <div className='tags-wrapper'>
                    {
                      video.tags.map(tag=>(
                        <p className='tag'>{tag}</p>
                      ))
                    }
                  </div> */}
                  <p className='category'>{video.category}</p>
                  <p className='views'>{video.views} views</p>
                  <p>{Math.floor((Date.now() - new Date(video.createdAt))/(1000*60*60*24)) == 0 ? 'Today' :  Math.floor((Date.now() - new Date(video.createdAt))/(1000*60*60*24)) + ' day ago'}</p>
                  {/* {console.log(Date.now() - new Date(video.createdAt))} */}
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default Home