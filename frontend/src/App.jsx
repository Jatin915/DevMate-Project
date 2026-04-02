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
import OnboardingSkills from './pages/OnboardingSkills'
import OnboardingAssessment from './pages/OnboardingAssessment'
import BeginnerHtmlStart from './pages/BeginnerHtmlStart'
import PlaylistInputPage from './pages/PlaylistInputPage'
import OnboardingCustomJourney from './pages/OnboardingCustomJourney'
import { getAuthToken, readOnboarding } from './utils/api'

function RequireAuthAndOnboarding({ children }) {
  const token = getAuthToken()
  const onboarding = readOnboarding()

  if (!token) return <Navigate to="/login" replace />
  if (!onboarding?.assessmentCompleted) {
    if (onboarding?.skillsSelected) return <Navigate to="/onboarding/assessment" replace />
    return <Navigate to="/onboarding/skills" replace />
  }
  return children
}

function OnboardingRoute({ mode }) {
  const token = getAuthToken()
  const onboarding = readOnboarding()

  if (!token) return <Navigate to="/login" replace />
  if (onboarding?.assessmentCompleted) {
    if (onboarding?.startMode === 'beginner' && onboarding?.journeyStarted) {
      return <Navigate to="/onboarding/html-playlist" replace />
    }
    return <Navigate to="/dashboard" replace />
  }
  if (mode === 'assessment' && !onboarding?.skillsSelected) return <Navigate to="/onboarding/skills" replace />
  if (mode === 'skills' && onboarding?.skillsSelected) return <Navigate to="/onboarding/assessment" replace />
  return mode === 'skills' ? <OnboardingSkills /> : <OnboardingAssessment />
}

function InnerRoutes() {
  return (
    <RequireAuthAndOnboarding>
      <AppLayout>
        <Routes>
          <Route path="/dashboard"     element={<Dashboard />} />
          <Route path="/roadmap"       element={<Roadmap />} />
          <Route path="/video-task"    element={<VideoTask />} />
          <Route path="/code-editor"   element={<CodeEditor />} />
          <Route path="/mini-project"          element={<MiniProject />} />
          <Route path="/mini-project/:language" element={<MiniProject />} />
          <Route path="/simulation"    element={<SimulationMode />} />
          <Route path="/progress"      element={<Progress />} />
          <Route path="/job-readiness" element={<JobReadiness />} />
          <Route path="/profile"       element={<Profile />} />
          <Route path="/certificate"   element={<Certificate />} />
        </Routes>
      </AppLayout>
    </RequireAuthAndOnboarding>
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
        <Route path="/onboarding/skills" element={<OnboardingRoute mode="skills" />} />
        <Route path="/onboarding/assessment" element={<OnboardingRoute mode="assessment" />} />
        <Route path="/onboarding/html-playlist" element={<PlaylistInputPage />} />
        <Route path="/onboarding/custom-journey" element={<OnboardingCustomJourney />} />
        <Route path="/journey/playlist" element={<PlaylistInputPage />} />
        <Route path="/*"            element={<InnerRoutes />} />
        <Route path="*"             element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
