import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, Search, Users, X, SlidersHorizontal, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCharacters, createCharacter, deleteCharacter } from '../api/characters'
import { getTemplateByKey } from '../api/templates'
import { useProject } from '../context/ProjectContext'
import CharacterCard from '../components/characters/CharacterCard'
import CharacterForm from '../components/characters/CharacterForm'
import CharacterDetail from '../components/characters/CharacterDetail'
import IdeaGenerator from '../components/characters/IdeaGenerator'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import InkStroke from '../components/layout/InkStroke'

const STATUS_FILTER_OPTIONS = [
  { value: '',         label: 'Всі' },
  { value: 'alive',    label: 'Живі' },
  { value: 'deceased', label: 'Загиблі' },
  { value: 'unknown',  label: 'Невідомо' },
]

// НОВЕ: бекенд повертає tags як рядок ("маг, водяний"), а не масив —
// тому всюди парсимо його через цю допоміжну функцію
const parseTags = (tags) =>
  Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [])

export default function CharactersPage() {
  const { activeProjectId } = useProject()

  const [characters, setCharacters]       = useState([])
  const [templateCache, setTemplateCache] = useState({}) // key → detail object
  const [isLoading, setIsLoading]         = useState(true)
  const [isSubmitting, setIsSubmitting]   = useState(false)
  const [error, setError]                 = useState(null)

  // Фільтри (суто фронтенд)
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTag, setFilterTag]       = useState('')
  const [showFilters, setShowFilters]   = useState(false)

  // Модалки
  const [isCreateOpen, setIsCreateOpen]   = useState(false)
  const [selectedChar, setSelectedChar]   = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  // ── Завантаження ───────────────────────────────────────────────────────────
  // ВИПРАВЛЕНО: передаємо activeProjectId у запит, щоб бекенд сам фільтрував
  // (раніше завантажувались усі персонажі з усіх проєктів)
  const load = useCallback(async () => {
    setIsLoading(true); setError(null)
    try {
      const data = await getCharacters(activeProjectId)
      setCharacters(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [activeProjectId])

  useEffect(() => { load() }, [load])

  // Кешуємо деталі шаблону для кожного унікального template_key
  useEffect(() => {
    const keys = [...new Set(characters.map((c) => c.template_key).filter(Boolean))]
    keys.forEach(async (key) => {
      if (templateCache[key]) return
      try {
        const tpl = await getTemplateByKey(key)
        setTemplateCache((prev) => ({ ...prev, [key]: tpl }))
      } catch { /* ігноруємо */ }
    })
  }, [characters]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Фільтрація ─────────────────────────────────────────────────────────────
  // ВИПРАВЛЕНО: парсимо рядок тегів у масив перед побудовою списку унікальних тегів
  const allTags = useMemo(() => {
    const set = new Set()
    characters.forEach((c) => parseTags(c.tags).forEach((t) => set.add(t)))
    return [...set].sort()
  }, [characters])

  const filtered = useMemo(() => {
    let list = characters

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.biography || '').toLowerCase().includes(q)
      )
    }
    if (filterStatus) list = list.filter((c) => c.status === filterStatus)
    // ВИПРАВЛЕНО: фільтр тегів тепер теж парсить рядок у масив перед перевіркою
    if (filterTag) list = list.filter((c) => parseTags(c.tags).includes(filterTag))

    return list
  }, [characters, search, filterStatus, filterTag])

  const hasFilters = search || filterStatus || filterTag
  const clearFilters = () => { setSearch(''); setFilterStatus(''); setFilterTag('') }

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleCreate = async (payload) => {
    setIsSubmitting(true)
    try {
      const created = await createCharacter({ ...payload, project_id: activeProjectId || payload.project_id })
      setCharacters((prev) => [created, ...prev])
      toast.success(`Персонажа «${created.name}» створено`)
      setIsCreateOpen(false)
    } catch (err) { toast.error(err.message) }
    finally { setIsSubmitting(false) }
  }

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return
    try {
      await deleteCharacter(pendingDelete.id)
      setCharacters((prev) => prev.filter((c) => c.id !== pendingDelete.id))
      if (selectedChar?.id === pendingDelete.id) setSelectedChar(null)
      toast.success(`«${pendingDelete.name}» видалено`)
    } catch (err) { toast.error(err.message) }
    finally { setPendingDelete(null) }
  }

  const handleUpdated = (updated) => {
    setCharacters((prev) => prev.map((c) => c.id === updated.id ? updated : c))
    if (selectedChar?.id === updated.id) setSelectedChar(updated)
  }

  const handleDeleted = (id) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id))
    setSelectedChar(null)
  }

  // ── Рендер ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full gap-6">

      {/* ── Ліва панель (список) ── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Заголовок */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-3xl font-medium text-parchment">Персонажі</h2>
            <InkStroke className="mt-1" width={100} />
          </div>
          <div className="flex items-center gap-2">
            <IdeaGenerator characters={characters} />
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft"
            >
              <Plus size={16} /> Новий персонаж
            </button>
          </div>
        </div>

        {/* Пошук + фільтри */}
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex gap-2">
            {/* Рядок пошуку */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-parchment-dim" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Пошук за іменем або описом…"
                className="w-full rounded-md border border-ink-500 bg-ink-800 py-2 pl-9 pr-9 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-parchment-dim hover:text-parchment">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Кнопка фільтрів */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors ${
                showFilters || filterStatus || filterTag
                  ? 'border-amber-ink text-amber-soft'
                  : 'border-ink-500 text-parchment-dim hover:border-ink-300 hover:text-parchment'
              }`}
            >
              <SlidersHorizontal size={14} />
              Фільтри
              {(filterStatus || filterTag) && (
                <span className="rounded-full bg-amber-ink px-1.5 py-0.5 text-xs font-bold leading-none text-ink-900">
                  {[filterStatus, filterTag].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Панель фільтрів */}
          {showFilters && (
            <div className="flex flex-wrap gap-4 rounded-md border border-ink-500 bg-ink-800 px-4 py-3">
              {/* Статус */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-parchment-dim">Статус</span>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => setFilterStatus(opt.value)}
                      className={`rounded-full px-3 py-0.5 text-xs transition-colors ${
                        filterStatus === opt.value
                          ? 'bg-amber-ink font-medium text-ink-900'
                          : 'bg-ink-700 text-parchment-dim hover:bg-ink-500'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Теги */}
              {allTags.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-parchment-dim">Тег</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setFilterTag('')}
                      className={`rounded-full px-3 py-0.5 text-xs transition-colors ${
                        !filterTag ? 'bg-amber-ink font-medium text-ink-900' : 'bg-ink-700 text-parchment-dim hover:bg-ink-500'
                      }`}>Всі</button>
                    {allTags.map((tag) => (
                      <button key={tag} onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
                        className={`rounded-full px-3 py-0.5 text-xs transition-colors ${
                          filterTag === tag ? 'bg-amber-ink font-medium text-ink-900' : 'bg-ink-700 text-parchment-dim hover:bg-ink-500'
                        }`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasFilters && (
                <button onClick={clearFilters}
                  className="self-end text-xs text-crimson-soft hover:underline">
                  Скинути фільтри
                </button>
              )}
            </div>
          )}

          {/* Лічильник */}
          {!isLoading && (
            <p className="text-xs text-parchment-dim">
              {hasFilters
                ? `Показано ${filtered.length} з ${characters.length} персонажів`
                : `Усього: ${characters.length}`}
            </p>
          )}
        </div>

        {/* Список / стани */}
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-parchment-dim">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Завантаження…</span>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-crimson-dim bg-crimson-dim/10 px-5 py-4">
            <p className="text-sm text-crimson-soft">{error}</p>
            <button onClick={load} className="mt-2 text-xs text-crimson-soft underline hover:no-underline">
              Спробувати знову
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-ink-500 px-6 py-16 text-center">
            <Users size={28} strokeWidth={1.5} className="text-parchment-dim" />
            {hasFilters ? (
              <>
                <h3 className="mt-4 font-display text-xl text-parchment">Нічого не знайдено</h3>
                <p className="mt-2 text-sm text-parchment-dim">Змініть пошук або скиньте фільтри.</p>
                <button onClick={clearFilters} className="mt-4 text-sm text-amber-soft underline hover:no-underline">
                  Скинути фільтри
                </button>
              </>
            ) : (
              <>
                <h3 className="mt-4 font-display text-xl text-parchment">Персонажів ще немає</h3>
                <p className="mt-2 text-sm text-parchment-dim">Створіть першого персонажа для цього проєкту.</p>
                <button onClick={() => setIsCreateOpen(true)}
                  className="mt-5 flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft">
                  <Plus size={16} /> Створити персонажа
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => (
              <CharacterCard
                key={c.id} character={c}
                templateDetail={templateCache[c.template_key] ?? null}
                onSelect={setSelectedChar}
                onDelete={setPendingDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Права панель (деталі) ── */}
      {selectedChar && (
        <aside className="w-96 shrink-0 overflow-y-auto rounded-lg border border-ink-500 bg-ink-800 px-6 py-5">
          <CharacterDetail
            character={selectedChar}
            templateDetail={templateCache[selectedChar.template_key] ?? null}
            onClose={() => setSelectedChar(null)}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        </aside>
      )}

      {/* Модалка створення */}
      <Modal title="Новий персонаж" isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="max-w-xl">
        <CharacterForm
          projectId={activeProjectId}
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Підтвердження видалення */}
      <ConfirmDialog
        isOpen={!!pendingDelete} onClose={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm} title="Видалити персонажа?"
        message={`Ви впевнені, що хочете видалити «${pendingDelete?.name}»? Цю дію не можна скасувати.`}
        confirmLabel="Видалити" isDangerous
      />
    </div>
  )
}
