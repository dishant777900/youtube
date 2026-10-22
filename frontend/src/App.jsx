import { Route, Routes } from "react-router-dom"
import NavBar from "./component/NavBar"
import Home from "./component/Home"
import Login from "./component/Login"
import Signup from "./component/Signup"
import AddVideo from "./component/AddVideo"
import Video from "./component/Video"

const App=()=>{

  return(

    <Routes>
      <Route path="/" element={<NavBar/>}>
        <Route path="" element={<Home/>}/>
        <Route path="Upload-video" element={<AddVideo/>}/>
        <Route path="login" element={<Login/>}/>
       <Route path="video/:id" element={<Video/>}/>
        <Route path="signup" element={<Signup/>}/>
      </Route>
    </Routes>
  )
}


export default App