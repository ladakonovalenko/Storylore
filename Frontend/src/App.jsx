import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider }    from './context/AuthContext'
import { ProjectProvider } from './context/ProjectContext'
import ProtectedRoute  from './components/common/ProtectedRoute'
import Layout          from './components/layout/Layout'
import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'
import ProjectsPage    from './pages/ProjectsPage'
import TemplatesPage   from './pages/TemplatesPage'
import CharactersPage  from './pages/CharactersPage'
import FactionsPage    from './pages/FactionsPage'
import RelationshipsPage from './pages/RelationshipsPage'
import WorldMapPage    from './pages/WorldMapPage'
import TimelinePage    from './pages/TimelinePage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1F2230',
              color: '#E8E2D3',
              border: '1px solid #3A3F54',
            },
          }}
        />
        <Routes>
          {/* Публічні сторінки — без Layout і без перевірки токена */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Захищені сторінки — редірект на /login якщо не авторизований */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/projects" replace />} />
              <Route path="/projects"      element={<ProjectsPage />} />
              <Route path="/templates"     element={<TemplatesPage />} />
              <Route path="/characters"    element={<CharactersPage />} />
              <Route path="/factions"      element={<FactionsPage />} />
              <Route path="/relationships" element={<RelationshipsPage />} />
              <Route path="/world-map"     element={<WorldMapPage />} />
              <Route path="/timeline"      element={<TimelinePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*"              element={<Navigate to="/projects" replace />} />
            </Route>
          </Route>
        </Routes>
      </ProjectProvider>
    </AuthProvider>
  )
}
