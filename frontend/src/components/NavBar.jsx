import { Link, Outlet } from "react-router-dom"
import '../App.css';
import { useState } from "react";
const NavBar = () => {

    const [isLogin, setLogin] = useState(Boolean(localStorage.getItem('token')))

    const logoutHandler = () => {
        localStorage.clear()
        setLogin(false)
    }
    const setLoginState = (state) => {
        setLogin(state)
        localStorage.setItem('isLogin', String(state))


    }


    return (
        <>
            <div className="nav">

                <h2 className="logo-text">
                    <span className="logo">SBS</span> Tube
                </h2>
                <div className="menu">
                    <Link to="/" className="link">Home</Link>
                    {isLogin && <Link to="/add-video" className="link">Upload</Link>}
                    {!isLogin ? <Link to="/login" className="link">Login</Link> :
                        <div className="channelName-nav">{localStorage.getItem('channelName')}</div>}
                    {isLogin && <div className="logout-btn" onClick={logoutHandler}><div>Logout</div> <span><i className="fa-solid fa-arrow-right-from-bracket"></i></span>
                    </div>}

                </div>
            </div>
            <div>
                <Outlet context={{ setLoginState }} />
            </div>
        </>
    )
}
export default NavBar