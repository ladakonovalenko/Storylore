import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider }    from './context/AuthContext'
import { ProjectProvider } from './context/ProjectContext'
import { ThemeProvider }   from './context/ThemeContext'
import { EntityRegistryProvider } from './context/EntityRegistryContext'
import ProtectedRoute  from './components/common/ProtectedRoute'
import Layout          from './components/layout/Layout'
import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'
import ProfilePage     from './pages/ProfilePage'
import ProjectsPage    from './pages/ProjectsPage'
import TemplatesPage   from './pages/TemplatesPage'
import CharactersPage  from './pages/CharactersPage'
import FactionsPage    from './pages/FactionsPage'
import RelationshipsPage from './pages/RelationshipsPage'
import WorldMapPage    from './pages/WorldMapPage'
import TimelinePage    from './pages/TimelinePage'
import WikiPage        from './pages/WikiPage'
import RemindersPage    from './pages/RemindersPage'
import PlotOutlinePage  from './pages/PlotOutlinePage'
import AtmospherePage   from './pages/AtmospherePage'
import StructurePage    from './pages/StructurePage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProjectProvider>
          <EntityRegistryProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                // НОВЕ: кольори через CSS-змінні — toast сам перемикається з темою
                background: 'var(--ink-700)',
                color: 'var(--parchment)',
                border: '1px solid var(--ink-500)',
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
                <Route path="/profile"       element={<ProfilePage />} />
                <Route path="/projects"      element={<ProjectsPage />} />
                <Route path="/templates"     element={<TemplatesPage />} />
                <Route path="/characters"    element={<CharactersPage />} />
                <Route path="/factions"      element={<FactionsPage />} />
                <Route path="/relationships" element={<RelationshipsPage />} />
                <Route path="/world-map"     element={<WorldMapPage />} />
                <Route path="/timeline"      element={<TimelinePage />} />
                <Route path="/wiki"          element={<WikiPage />} />
                <Route path="/reminders"     element={<RemindersPage />} />
                <Route path="/plot-outline"  element={<PlotOutlinePage />} />
                <Route path="/atmosphere"    element={<AtmospherePage />} />
                <Route path="/structure"     element={<StructurePage />} />
                <Route path="*"              element={<Navigate to="/projects" replace />} />
              </Route>
            </Route>
          </Routes>
          </EntityRegistryProvider>
        </ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
