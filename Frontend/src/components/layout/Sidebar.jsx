import { NavLink, Link } from 'react-router-dom'
import {
  BookOpen, Users, Shield, GitBranch,
  Map, Clock, FileText, UserCircle, LogOut,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import InkStroke from './InkStroke'

const NAV_ITEMS = [
  { to: '/projects',      label: 'Проєкти',    icon: BookOpen  },
  { to: '/characters',    label: 'Персонажі',  icon: Users     },
  { to: '/factions',      label: 'Фракції',    icon: Shield    },
  { to: '/relationships', label: 'Зв\u2019язки', icon: GitBranch },
  { to: '/world-map',     label: 'Мапа світу', icon: Map       },
  { to: '/timeline',      label: 'Таймлайн',   icon: Clock     },
  { to: '/templates',     label: 'Шаблони',    icon: FileText  },
]

export default function Sidebar() {
  const { user, isGuest, logout } = useAuth()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <aside className="flex h-full w-60 flex-col border-r border-ink-500 bg-ink-800 px-3 py-5">
      {/* Логотип */}
      <Link to="/profile" className="mb-8 px-3 transition-opacity hover:opacity-80">
        <span className="font-display text-xl font-semibold tracking-wide text-parchment">
          StoryLore
        </span>
        <p className="mt-1 text-xs text-parchment-dim">майстерня світобудови</p>
      </Link>

      {/* Навігація */}
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-ink-700 text-parchment'
                  : 'text-parchment-dim hover:bg-ink-700/60 hover:text-parchment',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} strokeWidth={1.75} />
                <span>{label}</span>
                {isActive && (
                  <InkStroke
                    className="absolute -bottom-0.5 left-3"
                    width={36}
                    color="var(--amber-ink)"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Профіль внизу сайдбару */}
      <div className="border-t border-ink-500 pt-4">
        {isGuest ? (
          <div className="flex flex-col gap-2 px-3">
            <div className="flex items-center gap-2">
              <UserCircle size={16} className="text-parchment-dim/60" />
              <span className="text-xs text-parchment-dim/60">Гостьовий режим</span>
            </div>
            <Link
              to="/login"
              className="text-xs text-amber-soft hover:underline"
            >
              Увійти або зареєструватись
            </Link>
          </div>
        ) : user ? (
          <div className="flex flex-col gap-2 px-3">
            <Link
              to="/profile"
              className="group flex items-center gap-2 rounded-md py-1.5 transition-colors hover:text-parchment"
            >
              <UserCircle size={16} className="shrink-0 text-parchment-dim" />
              <div className="min-w-0">
                <p className="truncate text-sm text-parchment">{user.username}</p>
                <p className="truncate text-xs text-parchment-dim/60">{user.email}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs text-parchment-dim/60 hover:text-crimson-soft"
            >
              <LogOut size={13} />
              Вийти
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
