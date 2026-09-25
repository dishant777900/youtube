import { Route, Routes } from 'react-router-dom'
import './App.css'
import NavBar from './components/NavBar'
import Home from './components/Home'
import Login from './components/Login'
import Signup from './components/Signup'
import Profile from './components/Profile'
import AddVideo from './components/AddVideo'
import ChannelVideo from './components/ChannelVideo'
import Video from './components/Video'
const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/' element={<NavBar />}>
          <Route path='' element={<Home/>}/>
          <Route path='home' element={<Home />} />
          <Route path='login' element={<Login />} />
          <Route path='signup' element = {<Signup/>}/>
          <Route path = 'profile' element = {<Profile/>}/>
          <Route path='add-video' element = {<AddVideo/>}/>
          <Route path='channel-video' element = {<ChannelVideo/>}/>
          <Route path='video/:id' element = {<Video/>}/>
        </Route>
      </Routes>
    </div>
  )
}

export default App