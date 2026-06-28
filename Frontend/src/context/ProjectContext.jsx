import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getProjects } from '../api/projects'

const ProjectContext = createContext(null)

const ACTIVE_PROJECT_STORAGE_KEY = 'storylore.activeProjectId'

export function ProjectProvider({ children }) {
  const [projects,       setProjects]       = useState([])
  const [activeProjectId,setActiveProjectId]= useState(() =>
    localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY) || null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState(null)

  const refreshProjects = useCallback(async () => {
    // ✅ Якщо гість — не робимо запит до API, проєкти порожні
    const token   = localStorage.getItem('access_token')
    const isGuest = localStorage.getItem('storylore.isGuest') === 'true'

    if (!token || isGuest) {
      setProjects([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const data = await getProjects()
      setProjects(data)
      const stillExists = data.some((p) => String(p.id) === String(activeProjectId))
      if (!stillExists && data.length > 0) {
        setActiveProjectId(data[0].id)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [activeProjectId])

  useEffect(() => { refreshProjects() }, [])

  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, activeProjectId)
    }
  }, [activeProjectId])

  const activeProject = projects.find((p) => String(p.id) === String(activeProjectId)) || null

  return (
    <ProjectContext.Provider value={{
      projects, activeProject, activeProjectId,
      setActiveProjectId, isLoading, error, refreshProjects,
    }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject має використовуватися всередині <ProjectProvider>')
  return ctx
}
