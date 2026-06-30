import { useState, useEffect, useCallback } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  BookOpen, Users, Shield, GitBranch, Map, Clock, BookText,
  Bell, ListTree, Sparkles, Layers, FileText,
  Settings, ChevronDown, ChevronRight, Folder, File,
} from 'lucide-react'
import InkStroke from './InkStroke'
import NavSettingsModal from './NavSettingsModal'
import { useProject } from '../../context/ProjectContext'
import { getProjectCustomPages } from '../../api/customPages'
import { getNavFolders } from '../../api/navFolders'

// НОВЕ: кожен фіксований пункт тепер має стабільний 'key' —
// саме цей ключ використовується в NavItem.item_key при призначенні в папку
const BASE_NAV_ITEMS = [
  { key: 'projects',      to: '/projects',      label: 'Проєкти',       icon: BookOpen },
  { key: 'characters',    to: '/characters',    label: 'Персонажі',     icon: Users },
  { key: 'factions',      to: '/factions',      label: 'Фракції',       icon: Shield },
  { key: 'relationships', to: '/relationships', label: 'Зв\u2019язки',  icon: GitBranch },
  { key: 'world-map',     to: '/world-map',     label: 'Мапа світу',    icon: Map },
  { key: 'timeline',      to: '/timeline',      label: 'Таймлайн',      icon: Clock },
  { key: 'wiki',          to: '/wiki',          label: 'Бібліотека',    icon: BookText },
  { key: 'plot-outline',  to: '/plot-outline',  label: 'Каркас сюжету', icon: ListTree },
  { key: 'structure',     to: '/structure',     label: 'Структура',     icon: Layers },
  { key: 'atmosphere',    to: '/atmosphere',    label: 'Атмосфера',     icon: Sparkles },
  { key: 'reminders',     to: '/reminders',     label: 'Не забути',     icon: Bell },
  { key: 'templates',     to: '/templates',     label: 'Шаблони',       icon: FileText },
]

function NavItemLink({ to, label, icon: Icon }) {
  return (
    <NavLink
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
          <span className="truncate">{label}</span>
          {isActive && (
            <InkStroke className="absolute -bottom-0.5 left-3" width={36} color="var(--amber-ink)" />
          )}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const { activeProjectId } = useProject()
  const location = useLocation()

  const [customPages, setCustomPages] = useState([])
  const [folders, setFolders] = useState([])
  const [expandedFolders, setExpandedFolders] = useState({})
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const loadCustomPages = useCallback(async () => {
    if (!activeProjectId) { setCustomPages([]); return }
    try {
      const data = await getProjectCustomPages(activeProjectId)
      setCustomPages(data)
    } catch { /* мовчки ігноруємо в навігації */ }
  }, [activeProjectId])

  const loadFolders = useCallback(async () => {
    try {
      const data = await getNavFolders()
      setFolders(data)
    } catch { /* мовчки ігноруємо в навігації */ }
  }, [])

  useEffect(() => { loadCustomPages() }, [loadCustomPages])
  useEffect(() => { loadFolders() }, [loadFolders])

  const toggleFolder = (id) => setExpandedFolders((prev) => ({ ...prev, [id]: !prev[id] }))

  // НОВЕ: ключі фіксованих пунктів і id власних сторінок, що вже призначені в якусь папку —
  // їх треба прибрати зі звичайного списку, бо вони показуються всередині своєї папки
  const assignedBuiltInKeys = new Set(
    folders.flatMap((f) => f.items.filter((i) => i.item_type === 'built_in').map((i) => i.item_key))
  )
  const assignedCustomPageIds = new Set(
    folders.flatMap((f) => f.items.filter((i) => i.item_type === 'custom_page').map((i) => i.item_key))
  )

  const ungroupedBaseItems = BASE_NAV_ITEMS.filter((item) => !assignedBuiltInKeys.has(item.key))
  const ungroupedCustomPages = customPages.filter((p) => !assignedCustomPageIds.has(String(p.id)))

  const resolveItemLabelIcon = (item) => {
    if (item.item_type === 'built_in') {
      const found = BASE_NAV_ITEMS.find((b) => b.key === item.item_key)
      return found ? { label: found.label, icon: found.icon, to: found.to } : { label: item.item_key, icon: File, to: '/projects' }
    }
    const found = customPages.find((p) => String(p.id) === item.item_key)
    return { label: found?.title ?? 'Сторінка', icon: File, to: `/page/${item.item_key}` }
  }

  return (
    <aside className="flex h-full w-60 flex-col border-r border-ink-500 bg-ink-800 px-3 py-5">
      <Link to="/profile" className="mb-8 px-3 transition-opacity hover:opacity-80">
        <span className="font-display text-xl font-semibold tracking-wide text-parchment">
          StoryLore
        </span>
        <p className="mt-1 text-xs text-parchment-dim">майстерня світобудови</p>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {/* Фіксовані пункти, що не призначені в жодну папку */}
        {ungroupedBaseItems.map((item) => (
          <NavItemLink key={item.key} to={item.to} label={item.label} icon={item.icon} />
        ))}

        {/* Власні сторінки проєкту, що не призначені в жодну папку */}
        {ungroupedCustomPages.map((page) => (
          <NavItemLink key={`page-${page.id}`} to={`/page/${page.id}`} label={page.title} icon={File} />
        ))}

        {/* НОВЕ: папки */}
        {folders.map((folder) => {
          const isOpen = !!expandedFolders[folder.id]
          const isFolderActive = folder.items.some((item) => {
            const { to } = resolveItemLabelIcon(item)
            return location.pathname === to
          })
          return (
            <div key={folder.id}>
              <button
                onClick={() => toggleFolder(folder.id)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors ${
                  isFolderActive ? 'text-amber-soft' : 'text-parchment-dim hover:bg-ink-700/60 hover:text-parchment'
                }`}
              >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Folder size={16} strokeWidth={1.75} />
                <span className="truncate">{folder.name}</span>
              </button>
              {isOpen && (
                <div className="ml-4 flex flex-col gap-0.5 border-l border-ink-500 pl-2">
                  {folder.items.length === 0 ? (
                    <p className="px-3 py-1 text-xs italic text-parchment-dim/50">Порожньо</p>
                  ) : (
                    folder.items.map((item) => {
                      const { label, icon, to } = resolveItemLabelIcon(item)
                      return <NavItemLink key={item.id} to={to} label={label} icon={icon} />
                    })
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* НОВЕ: налаштування навігації */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-parchment-dim hover:bg-ink-700/60 hover:text-parchment"
      >
        <Settings size={14} /> Налаштувати меню
      </button>

      <div className="px-3 pt-2 text-xs text-parchment-dim">
        <p>Бекенд: 127.0.0.1:8001</p>
      </div>

      <NavSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        activeProjectId={activeProjectId}
        customPages={customPages}
        setCustomPages={setCustomPages}
        folders={folders}
        setFolders={setFolders}
        builtInItems={BASE_NAV_ITEMS.map((b) => ({ key: b.key, label: b.label }))}
      />
    </aside>
  )
}
