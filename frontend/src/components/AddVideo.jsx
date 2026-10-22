import { useState } from "react"
import axios from "axios"
import { Link, useNavigate } from "react-router-dom"
import swal from 'sweetalert'

const AddVideo = () => {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [video, setVideo] = useState(null)
    const [videoName, setVideoName] = useState(null)
    const [isLoading, setLoading] = useState(false)
    const navigate = useNavigate()

    const [thumbnail, setThumbnail] = useState(null)
    const [thumbnailurl, setThumbnailUrl] = useState(null)
    const [thumbnailName, setThumbnailName] = useState(null)

    const api_base_url = import.meta.env.VITE_API_URL


    const videoHandler = (e) => {
        setVideo(e.target.files[0])
        setVideoName(e.target.files[0].name)
        console.log(video);
        console.log(videoName);

    }

    const thumbnailhandler = (e) => {
        setThumbnail(e.target.files[0])
        setThumbnailName(e.target.files[0].name)
        setThumbnailUrl(URL.createObjectURL(e.target.files[0]))
        console.log(video);
        console.log(videoName);

    }
    const submitHandler = async (e) => {
        try {
            e.preventDefault()
            if (!video || !thumbnail) {
                swal({ text: "Please choose both a video and a thumbnail", icon: "warning", button: "Ok" })
                return
            }
            setLoading(true)
            const token = localStorage.getItem("token");
            const formData = new FormData()
            formData.append("title", title)
            formData.append("description", description)
            formData.append("video", video)
            formData.append("thumbnail", thumbnail)

            await axios.post(`${api_base_url}/video/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            setLoading(false)
            navigate('/')

            swal({
                text: "Video uploaded!",
                icon: "success",
                button: "Ok!",

            });

        }
        catch (err) {
            console.log(err);
            setLoading(false)
            swal({
                text: err.response?.data?.error || "Something is wrong!",
                icon: "error",
                button: "Ok",
            });

        }

    }

    return (


        <div className="form-wrapper">

            <form className="form" onSubmit={submitHandler}>
                <p className="form-heading">Upload video</p>

                <input type="file" id="video-input" onChange={videoHandler} />
                <div className="video-upload-wrapper">
                    <p>{videoName}</p>
                    <button type="button" onClick={() => { document.getElementById('video-input').click() }}>Upload video</button>

                </div>

                <input type="file" id="thumbnail-input" onChange={thumbnailhandler} />
                <div className="thumbnail-upload-wrapper">
                    <button type="button" onClick={() => { document.getElementById('thumbnail-input').click() }}>Upload thumbnail</button>
                    <div>
                        {thumbnailurl && <img src={thumbnailurl} alt="thumbnailImage" className="thumbanial-image-preview" />}
                        <p>{thumbnailName}</p>
                    </div>


                </div>

                <input className="form-input" required onChange={(e) => { setTitle(e.target.value) }} type="text" placeholder="title" />

                <textarea className="form-input" onChange={(e) => { setDescription(e.target.value) }} maxLength={2000} minLength={20} placeholder="descritption" />
                <button type="submit" className="submit-btn" >{isLoading && <span> <i className="fa-solid fa-spinner fa-spin-pulse"></i></span>} Upload</button>
            </form>
        </div>
    )
}
export default AddVideo