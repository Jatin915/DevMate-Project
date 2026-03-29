import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Features from './pages/Features'
import RoadmapInfo from './pages/RoadmapInfo'
import Pricing from './pages/Pricing'
import Dashboard from './pages/Dashboard'
import Roadmap from './pages/Roadmap'
import VideoTask from './pages/VideoTask'
import CodeEditor from './pages/CodeEditor'
import MiniProject from './pages/MiniProject'
import SimulationMode from './pages/SimulationMode'
import Progress from './pages/Progress'
import JobReadiness from './pages/JobReadiness'
import Profile from './pages/Profile'
import Certificate from './pages/Certificate'

function InnerRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard"     element={<Dashboard />} />
        <Route path="/roadmap"       element={<Roadmap />} />
        <Route path="/video-task"    element={<VideoTask />} />
        <Route path="/code-editor"   element={<CodeEditor />} />
        <Route path="/mini-project"  element={<MiniProject />} />
        <Route path="/simulation"    element={<SimulationMode />} />
        <Route path="/progress"      element={<Progress />} />
        <Route path="/job-readiness" element={<JobReadiness />} />
        <Route path="/profile"       element={<Profile />} />
        <Route path="/certificate"   element={<Certificate />} />
      </Routes>
    </AppLayout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<Landing />} />
        <Route path="/login"        element={<Login />} />
        <Route path="/features"     element={<Features />} />
        <Route path="/roadmap-info" element={<RoadmapInfo />} />
        <Route path="/pricing"      element={<Pricing />} />
        <Route path="/*"            element={<InnerRoutes />} />
        <Route path="*"             element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
