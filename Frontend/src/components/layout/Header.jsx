import { useState } from 'react'
import { ChevronDown, Loader2, UserCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProject } from '../../context/ProjectContext'
import { useAuth } from '../../context/AuthContext'
import InkStroke from './InkStroke'

export default function Header() {
  const { projects, activeProject, setActiveProjectId, isLoading, error } = useProject()
  const { user, isGuest } = useAuth()
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false)

  return (
    <header className="flex h-20 items-center justify-between border-b border-ink-500 bg-ink-900 px-8">
      {/* Ліва частина — перемикач проєктів */}
      <div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-parchment-dim">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Завантаження проєктів…</span>
          </div>
        ) : error ? (
          <p className="text-sm text-crimson-soft">{error}</p>
        ) : activeProject ? (
          <div className="relative">
            <button
              onClick={() => setIsSwitcherOpen((open) => !open)}
              className="flex items-center gap-2"
            >
              <h1 className="font-display text-2xl font-medium text-parchment">
                {activeProject.title || activeProject.name}
              </h1>
              <ChevronDown
                size={18}
                className={`text-parchment-dim transition-transform ${
                  isSwitcherOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            <InkStroke className="mt-1" width={100} />

            {isSwitcherOpen && (
              <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-md border border-ink-500 bg-ink-800 py-1 shadow-xl">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setActiveProjectId(project.id)
                      setIsSwitcherOpen(false)
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm hover:bg-ink-700 ${
                      project.id === activeProject.id
                        ? 'text-amber-soft'
                        : 'text-parchment-dim'
                    }`}
                  >
                    {project.title || project.name}
                  </button>
                ))}
                <div className="mt-1 border-t border-ink-500 px-4 pt-2">
                  <span className="text-xs text-parchment-dim">
                    Керування проєктами — у розділі «Проєкти»
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-parchment-dim">
            Ще немає жодного проєкту — створіть перший у розділі «Проєкти»
          </p>
        )}
      </div>

      {/* Права частина — профіль */}
      <div>
        {isGuest ? (
          <Link
            to="/login"
            className="rounded-md border border-ink-500 px-3 py-1.5 text-xs text-parchment-dim hover:border-amber-ink hover:text-amber-soft"
          >
            Увійти
          </Link>
        ) : user ? (
          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-parchment-dim transition-colors hover:bg-ink-800 hover:text-parchment"
          >
            <UserCircle size={18} className="text-parchment-dim" />
            <span>{user.username}</span>
          </Link>
        ) : null}
      </div>
    </header>
  )
}
