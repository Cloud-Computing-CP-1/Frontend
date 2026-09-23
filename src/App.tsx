

import './App.css'
import { BrowserRouter, Route, Routes } from "react-router-dom"
import Home from './pages/Home';
import Login from './pages/Login';

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Myprfile from './pages/Myprfile';
import BuildPipeline from './pages/BuildPipeline';
import Projects from './pages/Projects';
import ProjectImageDetails from './pages/ProjectImageDetails';
import AdminDashboard from './pages/AdminDashboard';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/dashbord" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/myDashboard" element={<Myprfile />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<Projects />} />
        <Route path="/projects/:projectId/images/:imageId" element={<ProjectImageDetails />} />
        <Route path="/dashboard" element={<Myprfile />} />
        <Route path="/build" element={<BuildPipeline />} />
      </Routes>
      <ReactQueryDevtools/>
    </BrowserRouter>
  )
}

export default App
