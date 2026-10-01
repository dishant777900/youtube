import axios from 'axios'
import React, { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import swal from 'sweetalert';

const Login = () => {
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [isLoading,setLoading] = useState(false)

  const navigate = useNavigate()
  const {setLoginState} = useOutletContext()

  const api = import.meta.env.VITE_API
  console.log(api)

  const submitHandler = async(e)=>{
   try
   {
    e.preventDefault()
    setLoading(true)
    const data = await axios.post(`${api}/user/login`,{
      email:email,
      password:password
    })
    console.log(data.data)
    localStorage.setItem('channelName',data.data.channelName)
    localStorage.setItem('token',data.data.token)
    localStorage.setItem('userId',data.data.channelId)
    setLoginState(true);
    navigate('/')
    setLoading(false)
    
   }
   catch(error)
   {
    console.log(error)
    setLoading(false)
    swal("Error!", "Something is Wrong!", "Error");
   }

  }
  return (
    <div className='form-wrapper'>
      <form className='form' onSubmit={submitHandler}>
        <p className='form-heading'>Login</p>
        <input className='form-input' onChange={(e)=>{setEmail(e.target.value)}} type="email" name='email' placeholder='email' value={email} />
        <input className='form-input' onChange={(e)=>{setPassword(e.target.value)}}  type="password" name="password" value={password} placeholder='password'/>
        <button className='submit-btn' type='submit'>{isLoading && <span><i className="fa-solid fa-spinner fa-spin-pulse"></i></span>} Login</button>
      <Link to="/signup">Signup if you dont have acount...</Link>

      </form>
    </div>
  )
}

export default Login