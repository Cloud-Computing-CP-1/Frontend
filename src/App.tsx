

import './App.css'
import { BrowserRouter, Route, Routes } from "react-router-dom"
import Home from './pages/Home';
import Login from './pages/Login';
import Sidebar from './pages/DashBoard/Sidebar';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/myDashboard" element={<Sidebar />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
