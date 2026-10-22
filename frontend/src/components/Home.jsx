import { useEffect, useState } from "react"
import axios from "axios"
import profile from "../assets/profile.webp"
import swal from 'sweetalert'
import { useNavigate } from "react-router-dom"
const daysAgo = (date) => {
    const days = Math.floor((Date.now() - new Date(date)) / (1000 * 60 * 60 * 24))
    return days > 0 ? `${days} day${days > 1 ? 's' : ''} ago` : "Today"
}

const Home = () => {
    const [allVideo, setAllvideo] = useState([])
    const api_base_url = import.meta.env.VITE_API_URL
    const navigate = useNavigate()

    useEffect(() => {
        getVideo()
    }, [])

    const getVideo = async () => {
        try {
            const videos = await axios.get(`${api_base_url}/video/allVideo`)
            console.log(videos)
            setAllvideo((videos.data.videos || []).slice().reverse())
        }
        catch (err) {
            swal({
                text: "Something is wrong!",
                icon: "error",
                button: "Ok",
            });

        }

    }


    return (
        <div className='home-wrapper'>
            <div className='video-wrapper'>
                {
                    allVideo.map(video => {
                        return (
                            <div className='video-card' key={video._id} onClick={() => { navigate(`/video/${video._id}`) }} >
                                <img className="video-thumbnail" src={video.thumbnailUrl}
                                    alt="thumbnail" />

                                <div className='video-detail'>
                                    <h1>{video.title}</h1>
                                    <div>
                                        <div className='profile-box'>
                                            <img
                                                className='user-profile'
                                                src={
                                                    video.uploadedBy?.profilePicUrl
                                                        ? video.uploadedBy?.profilePicUrl
                                                        : profile
                                                }
                                                alt="profile"
                                            />
                                            <p>{video.uploadedBy?.channelName || "Unknown channel"}</p>
                                        </div>
                                        <div>
                                            <p>{daysAgo(video.publishedAt)}</p>
                                            <p>{video.views || 0} views</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}

export default Home

