import { useState } from "react"
import { Link, Outlet, useNavigate } from "react-router-dom"

const NavBar = () => {
  const [isLogin,setLogin] = useState(localStorage.getItem('isLogin'))
  const navigate = useNavigate()

  const setLoginState = (state)=>
  {
    setLogin(state)
    localStorage.setItem('isLogin',state)
  }

  const logout = ()=>{
    localStorage.clear()
    setLogin(false)
    navigate('/home')
  }
  return (
    <div>
        <div className="nav-bar">
            <h2 className="logo-text">
                <span className="logo">SBS</span> Tube
            </h2>
            <div className="link">
                <Link className="menu-link" to="/">Home</Link>
                {!(localStorage.getItem('isLogin')) && <Link className="menu-link" to="/login">Login</Link>}
                {localStorage.getItem('isLogin') && <Link className="menu-link" to = '/add-video'>Upload Video</Link>}
                {localStorage.getItem('isLogin') && <Link className="menu-link" to = "/profile">{localStorage.getItem('channelName')}</Link>}
                {localStorage.getItem('isLogin') && <span onClick={logout} className="logout"><i className="fa-solid fa-right-from-bracket"></i> Logout</span>}
            </div>
        </div>
        <div>
            <Outlet context={{setLoginState}}/>
        </div>
    </div>
  )
}

export default NavBar