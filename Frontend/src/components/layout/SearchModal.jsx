import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, Shield, Map, BookText, Clock, FileText, X, Loader2 } from 'lucide-react'
import { useProject } from '../../context/ProjectContext'
import { getCharacters } from '../../api/characters'
import { getProjectFactions } from '../../api/factions'
import { getProjectLocations } from '../../api/locations'
import { getProjectWikiArticles } from '../../api/wiki'
import { getEvents } from '../../api/timeline'
import { getProjectCustomPages, getProjectCustomPageBlocks } from '../../api/customPages'

const TYPE_META = {
  character:   { label: 'Персонаж',        icon: Users,    path: '/characters' },
  faction:     { label: 'Фракція',         icon: Shield,   path: '/factions' },
  location:    { label: 'Локація',         icon: Map,      path: '/world-map' },
  wiki:        { label: 'Стаття',          icon: BookText, path: '/wiki' },
  event:       { label: 'Подія',           icon: Clock,    path: '/timeline' },
  // НОВЕ: власні сторінки — маршрут інший (/page/:id, без ?focus=)
  custom_page: { label: 'Власна сторінка', icon: FileText, path: '/page' },
}

const MAX_PER_GROUP = 6

export default function SearchModal() {
  const { activeProjectId } = useProject()
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState({
    characters: [], factions: [], locations: [], wiki: [], events: [],
    // НОВЕ
    customPages: [], customPageBlocks: [],
  })

  // ── Глобальний слухач Ctrl+K / Cmd+K ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((v) => !v)
      }
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Автофокус на полі вводу при відкритті
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [isOpen])

  // ── Завантаження даних активного проєкту при відкритті ───────────────────
  const loadData = useCallback(async () => {
    if (!activeProjectId) return
    setIsLoading(true)
    try {
      const [characters, factions, locations, wiki, events, customPages, customPageBlocks] = await Promise.all([
        getCharacters(activeProjectId),
        getProjectFactions(activeProjectId),
        getProjectLocations(activeProjectId),
        getProjectWikiArticles(activeProjectId),
        getEvents({ project_id: activeProjectId }),
        // НОВЕ
        getProjectCustomPages(activeProjectId),
        getProjectCustomPageBlocks(activeProjectId),
      ])
      setData({ characters, factions, locations, wiki, events, customPages, customPageBlocks })
    } catch {
      // мовчки ігноруємо — пошук просто буде порожнім
    } finally {
      setIsLoading(false)
    }
  }, [activeProjectId])

  useEffect(() => {
    if (isOpen) loadData()
  }, [isOpen, loadData])

  // ── Фільтрація ────────────────────────────────────────────────────────────
  const q = query.trim().toLowerCase()
  const match = (text) => text && text.toLowerCase().includes(q)

  // НОВЕ: власна сторінка вважається знайденою, якщо збігається її назва
  // АБО назва/текст будь-якого з її блоків — саме це і є "пошук по вмісту"
  const matchCustomPage = (page) => {
    if (match(page.title)) return true
    return data.customPageBlocks.some(
      (b) => b.page_id === page.id && (match(b.title) || match(b.content))
    )
  }

  const results = q ? {
    character:   data.characters.filter((c) => match(c.name) || match(c.description)).slice(0, MAX_PER_GROUP),
    faction:     data.factions.filter((f) => match(f.name) || match(f.description)).slice(0, MAX_PER_GROUP),
    location:    data.locations.filter((l) => match(l.name) || match(l.description)).slice(0, MAX_PER_GROUP),
    wiki:        data.wiki.filter((w) => match(w.title) || match(w.content)).slice(0, MAX_PER_GROUP),
    event:       data.events.filter((e) => match(e.title) || match(e.description)).slice(0, MAX_PER_GROUP),
    // НОВЕ
    custom_page: data.customPages.filter(matchCustomPage).slice(0, MAX_PER_GROUP),
  } : { character: [], faction: [], location: [], wiki: [], event: [], custom_page: [] }

  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0)

  const handleSelect = (type, item) => {
    setIsOpen(false)
    // НОВЕ: власна сторінка переходить напряму за id у шляху, без ?focus=
    if (type === 'custom_page') {
      navigate(`/page/${item.id}`)
      return
    }
    navigate(`${TYPE_META[type].path}?focus=${item.id}`)
  }

  const getLabel = (type, item) => {
    if (type === 'wiki') return item.title
    if (type === 'event') return item.title
    if (type === 'custom_page') return item.title
    return item.name
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[12vh]"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-ink-500 bg-ink-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Поле пошуку */}
        <div className="flex items-center gap-3 border-b border-ink-500 px-4 py-3">
          <Search size={17} className="shrink-0 text-parchment-dim" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={activeProjectId ? 'Пошук персонажів, фракцій, локацій, статей, подій, сторінок…' : 'Спочатку оберіть проєкт'}
            disabled={!activeProjectId}
            className="flex-1 bg-transparent text-sm text-parchment placeholder:text-parchment-dim/50 focus:outline-none"
          />
          {isLoading && <Loader2 size={14} className="shrink-0 animate-spin text-parchment-dim" />}
          <button onClick={() => setIsOpen(false)} className="shrink-0 text-parchment-dim hover:text-parchment">
            <X size={16} />
          </button>
        </div>

        {/* Результати */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {!activeProjectId ? (
            <p className="px-3 py-6 text-center text-sm text-parchment-dim">
              Оберіть активний проєкт, щоб шукати.
            </p>
          ) : !q ? (
            <p className="px-3 py-6 text-center text-sm text-parchment-dim/60">
              Почніть вводити, щоб знайти персонажа, фракцію, локацію, статтю, подію чи власну сторінку.
            </p>
          ) : totalResults === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-parchment-dim">
              Нічого не знайдено за запитом «{query}».
            </p>
          ) : (
            Object.entries(results).map(([type, items]) => {
              if (items.length === 0) return null
              const { label, icon: Icon } = TYPE_META[type]
              return (
                <div key={type} className="mb-2">
                  <p className="px-3 py-1 text-xs font-medium uppercase tracking-widest text-parchment-dim/60">
                    {label}
                  </p>
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(type, item)}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-parchment hover:bg-ink-700"
                    >
                      <Icon size={15} className="shrink-0 text-parchment-dim" />
                      <span className="truncate">{getLabel(type, item)}</span>
                    </button>
                  ))}
                </div>
              )
            })
          )}
        </div>

        {/* Підказка внизу */}
        <div className="flex items-center justify-end gap-1 border-t border-ink-500 px-4 py-2 text-xs text-parchment-dim/50">
          <kbd className="rounded border border-ink-500 px-1.5 py-0.5">Esc</kbd>
          щоб закрити
        </div>
      </div>
    </div>
  )
}
