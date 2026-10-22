import { useState } from "react"
import axios from "axios"
import { Link, useNavigate } from "react-router-dom"
import swal from 'sweetalert'
import { useOutletContext } from "react-router-dom"

const Signup = () => {
    const [channelName, setChannelName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [description, setDescription] = useState("")
    const [isLoading, setLoading] = useState(false)
    const navigate = useNavigate()

    const { setLoginState } = useOutletContext();

    const api_base_url =  import.meta.env.VITE_API_URL

    
    const submitHandler = async (e) => {
        try {
            e.preventDefault()
            setLoading(true)

            const data = {
                email,
                channelName,
                password,
                description
            }

            const signupRes = await axios.post(`${api_base_url}/user/signup`, data)
            const res = await axios.post(`${api_base_url}/user/login`, { email, password })
            const token = res.data.token
            const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))

            localStorage.setItem('token', token)
            localStorage.setItem('channelName', signupRes.data.newUser?.channelName || payload.channelName || channelName)
            localStorage.setItem('userId', signupRes.data.newUser?._id || payload._id || '')
            // localStorage.setItem('isLogin',true)
            setLoginState(true)
            navigate('/')
            setLoading(false)

            swal({
                text: "Account created succssfully!",
                icon: "success",
                button: "Ok!",

            });




        }
        catch (err) {
            console.log(err);
            setLoading(false)
            swal({
                text: err.response?.data?.error?.toString() || "Something is wrong!",
                icon: "error",
                button: "Ok",
            });


        }

    }
    return (
        <div className="form-wrapper">
            <form onSubmit={submitHandler} className="form">
                <h2>Create Account</h2>
                <input className="form-input" placeholder="Channel Name" value={channelName} type="text" name="channelname" onChange={(e) => setChannelName(e.target.value)} />
                <input className="form-input" placeholder="email" name="email" value={email} type="text" onChange={(e) => { setEmail(e.target.value) }} />
                <input className="form-input" placeholder="password" name="password" value={password} type="password" onChange={(e) => { setPassword(e.target.value) }} />
                <input className="form-input" placeholder="description" name="description" value={description} type="text" onChange={(e) => { setDescription(e.target.value) }} />

                <button className="submit-btn" type="submit" >{isLoading && <span> <i className="fa-solid fa-spinner fa-spin-pulse"></i></span>} Submit </button>



                <div className="link-wrapper">Already have an account? <Link to='/login'>Login </Link></div>
            </form>
        </div>
    )
}
export default Signup