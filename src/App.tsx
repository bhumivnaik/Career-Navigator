import './App.css'
import Register from './components/Register'
import Login from './components/Login'

import { BrowserRouter, Routes, Route } from 'react-router-dom'
function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* <Route path="/" element={<App />} /> */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
        <Register />
      </BrowserRouter>
    </>
  )
}

export default App
