import Register from './components/Register';
import Login from './components/Login';
import Profile from './components/Profile';
import SkillsSetup from "./components/SkillsSetup";
import Dashboard from './components/Dashboard';
import CareerDetails from "./components/CareerDetails";
import Career from "./components/Career";
import Progress from './components/Progress';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Account from "./components/Account";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/skills-setup" element={<SkillsSetup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/careers" element={<Career />} />
        <Route path="/careers/:careerId" element={<CareerDetails />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/account" element={<Account />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;