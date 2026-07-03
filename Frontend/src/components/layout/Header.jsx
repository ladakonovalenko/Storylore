import { useState } from 'react'
import { ChevronDown, Loader2, UserCircle, Search, Sun, Moon, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProject } from '../../context/ProjectContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import InkStroke from './InkStroke'

// НОВЕ: onOpenMenu — відкриває мобільне бічне меню (передається з Layout.jsx),
// undefined на десктопі, де гамбургер-кнопка й так не рендериться
export default function Header({ onOpenMenu }) {
  const { projects, activeProject, setActiveProjectId, isLoading, error } = useProject()
  const { user, isGuest } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false)

  const openSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
  }

  return (
    // ВИПРАВЛЕНО: менша висота й відступи на вузьких екранах (h-14/px-3),
    // повертається до звичного вигляду від sm: і ширше
    <header className="flex h-14 items-center justify-between border-b border-ink-500 bg-ink-900 px-3 sm:h-20 sm:px-8">
      {/* Ліва частина — гамбургер (лише мобільні) + перемикач проєктів */}
      <div className="flex min-w-0 items-center gap-2">
        {/* НОВЕ: гамбургер-кнопка мобільного меню — видима лише на вузьких екранах */}
        {onOpenMenu && (
          <button
            onClick={onOpenMenu}
            className="shrink-0 rounded-md p-1.5 text-parchment-dim hover:bg-ink-800 hover:text-parchment md:hidden"
            aria-label="Відкрити меню"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="min-w-0">
          {isLoading ? (
            <div className="flex items-center gap-2 text-parchment-dim">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Завантаження…</span>
            </div>
          ) : error ? (
            <p className="text-sm text-crimson-soft">{error}</p>
          ) : activeProject ? (
            <div className="relative min-w-0">
              <button
                onClick={() => setIsSwitcherOpen((open) => !open)}
                className="flex min-w-0 items-center gap-1.5 sm:gap-2"
              >
                {/* ВИПРАВЛЕНО: менший кегль і truncate на вузьких екранах —
                    довга назва проєкту раніше могла виштовхувати праву частину шапки */}
                <h1 className="truncate font-display text-lg font-medium text-parchment sm:text-2xl">
                  {activeProject.title || activeProject.name}
                </h1>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-parchment-dim transition-transform ${
                    isSwitcherOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <InkStroke className="mt-1 hidden sm:block" width={100} />

              {isSwitcherOpen && (
                <div className="absolute left-0 top-full z-20 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-md border border-ink-500 bg-ink-800 py-1 shadow-xl">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        setActiveProjectId(project.id)
                        setIsSwitcherOpen(false)
                      }}
                      className={`block w-full truncate px-4 py-2 text-left text-sm hover:bg-ink-700 ${
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
            <p className="truncate text-xs text-parchment-dim sm:text-sm">
              Ще немає жодного проєкту — створіть перший у розділі «Проєкти»
            </p>
          )}
        </div>
      </div>

      {/* Права частина — пошук + тема + профіль */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <button
          onClick={toggleTheme}
          aria-label="Перемкнути тему"
          className="flex items-center justify-center rounded-md border border-ink-500 p-2 text-parchment-dim transition-colors hover:border-amber-ink hover:text-amber-soft"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          onClick={openSearch}
          className="flex items-center gap-2 rounded-md border border-ink-500 px-2.5 py-2 text-sm text-parchment-dim transition-colors hover:border-amber-ink hover:text-amber-soft sm:px-3 sm:py-1.5"
        >
          <Search size={15} />
          <span className="hidden sm:inline">Пошук</span>
          <kbd className="hidden rounded border border-ink-500 px-1.5 py-0.5 text-xs text-parchment-dim/60 sm:inline">
            Ctrl+K
          </kbd>
        </button>

        {isGuest ? (
          <Link
            to="/login"
            className="rounded-md border border-ink-500 px-2.5 py-2 text-xs text-parchment-dim hover:border-amber-ink hover:text-amber-soft sm:px-3 sm:py-1.5"
          >
            Увійти
          </Link>
        ) : user ? (
          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-parchment-dim transition-colors hover:bg-ink-800 hover:text-parchment sm:px-3"
          >
            <UserCircle size={18} className="text-parchment-dim" />
            {/* ВИПРАВЛЕНО: ім'я користувача ховається на дуже вузьких екранах —
                залишається лише іконка, щоб не тіснити пошук/тему */}
            <span className="hidden sm:inline">{user.username}</span>
          </Link>
        ) : null}
      </div>
    </header>
  )
}
