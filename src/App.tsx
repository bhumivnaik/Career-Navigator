import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Profile from './pages/Profile'
import Register from './pages/Register'
import Login from './pages/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/profile" element={<Profile />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
    
  )
}

export default App