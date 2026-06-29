import { NavLink, Link } from 'react-router-dom'
import {
  BookOpen,
  Users,
  Shield,
  GitBranch,
  Map,
  Clock,
  BookText,
  Bell,
  ListTree,
  FileText,
} from 'lucide-react'
import InkStroke from './InkStroke'

const NAV_ITEMS = [
  { to: '/projects', label: 'Проєкти', icon: BookOpen },
  { to: '/characters', label: 'Персонажі', icon: Users },
  { to: '/factions', label: 'Фракції', icon: Shield },
  { to: '/relationships', label: 'Зв\u2019язки', icon: GitBranch },
  { to: '/world-map', label: 'Мапа світу', icon: Map },
  { to: '/timeline', label: 'Таймлайн', icon: Clock },
  { to: '/wiki', label: 'Бібліотека', icon: BookText },
  { to: '/plot-outline', label: 'Каркас сюжету', icon: ListTree },
  { to: '/reminders', label: 'Не забути', icon: Bell },
  { to: '/templates', label: 'Шаблони', icon: FileText },
]

export default function Sidebar() {
  return (
    <aside className="flex h-full w-60 flex-col border-r border-ink-500 bg-ink-800 px-3 py-5">
      {/* НОВЕ: клік на логотип веде на сторінку профілю */}
      <Link to="/profile" className="mb-8 px-3 transition-opacity hover:opacity-80">
        <span className="font-display text-xl font-semibold tracking-wide text-parchment">
          StoryLore
        </span>
        <p className="mt-1 text-xs text-parchment-dim">майстерня світобудови</p>
      </Link>

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

      <div className="px-3 pt-4 text-xs text-parchment-dim">
        <p>Бекенд: 127.0.0.1:8001</p>
      </div>
    </aside>
  )
}
