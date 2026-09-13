

import './App.css'
import { BrowserRouter, Route, Routes } from "react-router-dom"
import Home from './pages/Home';
import Login from './pages/Login';

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Myprfile from './pages/Myprfile';
import BuildPipeline from './pages/BuildPipeline';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/myDashboard" element={<Myprfile />} />
        <Route path="/build" element={<BuildPipeline />} />
      </Routes>
      <ReactQueryDevtools/>
    </BrowserRouter>
  )
}

export default App
