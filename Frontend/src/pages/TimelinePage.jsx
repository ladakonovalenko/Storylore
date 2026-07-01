import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Clock, Loader2, Filter, X, History, BookOpen, GitCommit, GitBranch } from 'lucide-react'
import toast from 'react-hot-toast'
import { getEvents, createEvent, updateEvent, deleteEvent } from '../api/timeline'
import { getCharacters } from '../api/characters'
import { getProjectEras } from '../api/eras'
import { getProjectArcs } from '../api/arcs'
import { getProjectEventCausalities } from '../api/eventCausalities'
import { getProjectBranches } from '../api/branches'
import { useProject } from '../context/ProjectContext'
import { formatYear } from '../utils/yearLabel'
import EventCard from '../components/timeline/EventCard'
import EventForm from '../components/timeline/EventForm'
import EraManager from '../components/timeline/EraManager'
import ArcManager from '../components/timeline/ArcManager'
import CausalityManager from '../components/timeline/CausalityManager'
import BranchManager from '../components/timeline/BranchManager'
// НОВЕ: детальні перегляди ер/арок/гілок
import EraDetailModal from '../components/timeline/EraDetailModal'
import ArcDetailModal from '../components/timeline/ArcDetailModal'
import BranchDetailModal from '../components/timeline/BranchDetailModal'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import InkStroke from '../components/layout/InkStroke'

const IMPORTANCE_OPTIONS = ['Основна', 'Другорядна', 'Фонова']

const EVENT_TYPES = [
  'Битва', 'Дипломатія', 'Відкриття', 'Особиста подія',
  'Катастрофа', 'Ритуал', 'Зустріч', 'Зрада', 'Смерть',
  'Народження', 'Союз', 'Конфлікт', 'Подорож', 'Таємниця',
]

export default function TimelinePage() {
  const { activeProject, activeProjectId } = useProject()
  const [searchParams, setSearchParams] = useSearchParams()

  const [events,       setEvents]       = useState([])
  const [characters,   setCharacters]   = useState([])
  const [eras,         setEras]         = useState([])
  const [arcs,         setArcs]         = useState([])
  const [causalities,  setCausalities]  = useState([])
  const [branches,     setBranches]     = useState([])
  const [activeLine,   setActiveLine]   = useState('main')

  const [isLoading,    setIsLoading]    = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error,        setError]        = useState(null)
  const [isModalOpen,  setIsModalOpen]  = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)

  const [isEraManagerOpen,       setIsEraManagerOpen]       = useState(false)
  const [isArcManagerOpen,       setIsArcManagerOpen]       = useState(false)
  const [isCausalityManagerOpen, setIsCausalityManagerOpen] = useState(false)
  const [isBranchManagerOpen,    setIsBranchManagerOpen]    = useState(false)

  // НОВЕ: яку еру/арку/гілку зараз переглядаємо в деталях (об'єкт або null)
  const [viewingEra,    setViewingEra]    = useState(null)
  const [viewingArc,    setViewingArc]    = useState(null)
  const [viewingBranch, setViewingBranch] = useState(null)

  // НОВЕ: підставляємо ці значення в форму нової події, коли її відкривають
  // кнопкою "Додати подію" з детального перегляду ери/арки/гілки
  const [prefill, setPrefill] = useState({ era_id: null, arc_id: null, branch_id: null })

  // Фільтри
  const [filterType,       setFilterType]       = useState('')
  const [filterImportance, setFilterImportance] = useState('')
  const [filterCharacter,  setFilterCharacter]  = useState('')
  const [filterEra,         setFilterEra]         = useState('')
  const [filterArc,         setFilterArc]         = useState('')
  const [groupBy,           setGroupBy]           = useState('year') // 'year' | 'era'
  const [sortAsc,           setSortAsc]           = useState(true)
  const [showFilters,       setShowFilters]       = useState(false)

  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, title: '' })

  const load = useCallback(async () => {
    if (!activeProjectId) {
      setEvents([]); setCharacters([]); setEras([]); setArcs([]); setCausalities([]); setBranches([])
      return
    }
    setIsLoading(true); setError(null)
    try {
      const [evs, chars, erasData, arcsData, causalitiesData, branchesData] = await Promise.all([
        getEvents({ project_id: activeProjectId }),
        getCharacters(activeProjectId),
        getProjectEras(activeProjectId),
        getProjectArcs(activeProjectId),
        getProjectEventCausalities(activeProjectId),
        getProjectBranches(activeProjectId),
      ])
      setEvents(evs)
      setCharacters(chars)
      setEras(erasData)
      setArcs(arcsData)
      setCausalities(causalitiesData)
      setBranches(branchesData)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [activeProjectId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const focusId = searchParams.get('focus')
    if (!focusId || events.length === 0) return
    const target = events.find((e) => String(e.id) === focusId)
    if (target) { setEditingEvent(target); setIsModalOpen(true) }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('focus')
      return next
    }, { replace: true })
  }, [searchParams, events]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── CRUD подій ────────────────────────────────────────────────────────────
  const handleCreate = async (payload) => {
    setIsSubmitting(true)
    try {
      const created = await createEvent(payload)
      setEvents((prev) => [created, ...prev])
      toast.success(`Подію «${created.title}» додано`)
      setIsModalOpen(false)
      setPrefill({ era_id: null, arc_id: null, branch_id: null })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async (id, payload) => {
    setIsSubmitting(true)
    try {
      const updated = await updateEvent(id, payload)
      setEvents((prev) => prev.map((e) => e.id === id ? updated : e))
      toast.success('Подію оновлено')
      setIsModalOpen(false)
      setEditingEvent(null)
    } catch (err) {
      toast.error(err.message)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteRequest = (event) => {
    setConfirmDelete({ isOpen: true, id: event.id, title: event.title })
  }

  const handleDeleteConfirm = async () => {
    const { id, title } = confirmDelete
    setConfirmDelete({ isOpen: false, id: null, title: '' })
    try {
      await deleteEvent(id)
      setEvents((prev) => prev.filter((e) => e.id !== id))
      setCausalities((prev) => prev.filter((c) => c.cause_event_id !== id && c.effect_event_id !== id))
      toast.success(`Подію «${title}» видалено`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  // НОВЕ: відкрити подію на редагування зсередини детального перегляду —
  // спершу закриваємо детальний перегляд, щоб модалки не накладались одна на одну
  const openEditFromDetail = (ev) => {
    setViewingEra(null); setViewingArc(null); setViewingBranch(null)
    setEditingEvent(ev)
    setIsModalOpen(true)
  }
  const openDeleteFromDetail = (ev) => {
    setViewingEra(null); setViewingArc(null); setViewingBranch(null)
    handleDeleteRequest(ev)
  }

  // НОВЕ: "Додати подію" з детального перегляду ери/арки/гілки —
  // одразу підставляє відповідний id у форму
  const openAddEventFor = (overrides) => {
    setViewingEra(null); setViewingArc(null); setViewingBranch(null)
    setEditingEvent(null)
    setPrefill({ era_id: null, arc_id: null, branch_id: null, ...overrides })
    setIsModalOpen(true)
  }

  const closeEventModal = () => {
    setIsModalOpen(false)
    setEditingEvent(null)
    setPrefill({ era_id: null, arc_id: null, branch_id: null })
  }

  // ── Фільтрація + сортування ───────────────────────────────────────────────
  const lineEvents = events.filter((e) =>
    activeLine === 'main' ? !e.branch_id : String(e.branch_id) === activeLine
  )

  const filtered = lineEvents
    .filter((e) => !filterType       || e.event_type === filterType)
    .filter((e) => !filterImportance || e.importance === filterImportance)
    .filter((e) => !filterCharacter  ||
      (e.participant_ids ?? []).includes(Number(filterCharacter)))
    .filter((e) => !filterEra || String(e.era_id) === filterEra)
    .filter((e) => !filterArc || String(e.arc_id) === filterArc)
    .sort((a, b) => {
      const ya = a.year ?? Infinity
      const yb = b.year ?? Infinity
      return sortAsc ? ya - yb : yb - ya
    })

  const hasFilters = filterType || filterImportance || filterCharacter || filterEra || filterArc
  const clearFilters = () => {
    setFilterType(''); setFilterImportance(''); setFilterCharacter('')
    setFilterEra(''); setFilterArc('')
  }

  const projectTitle = activeProject?.title || activeProject?.name || null

  const grouped = filtered.reduce((acc, e) => {
    let key
    if (groupBy === 'era') {
      const era = eras.find((era) => era.id === e.era_id)
      key = era ? era.name : 'Без ери'
    } else {
      key = e.year != null ? String(e.year) : e.date_label || 'Без дати'
    }
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  const groupKeys = groupBy === 'era'
    ? [...eras.map((e) => e.name), 'Без ери'].filter((k) => grouped[k])
    : (() => {
        const seen = new Set()
        const keys = []
        filtered.forEach((e) => {
          const key = e.year != null ? String(e.year) : (e.date_label || 'Без дати')
          if (!seen.has(key)) { seen.add(key); keys.push(key) }
        })
        return keys
      })()

  const inputCls = 'rounded-md border border-ink-500 bg-ink-800 px-3 py-1.5 text-sm text-parchment focus:border-amber-ink focus:outline-none'

  return (
    <div>
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-medium text-parchment">Таймлайн</h2>
          <InkStroke className="mt-1" width={90} />
          {projectTitle && (
            <p className="mt-2 text-sm text-parchment-dim">
              Проєкт: <span className="text-parchment">{projectTitle}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEraManagerOpen(true)}
            disabled={!activeProjectId}
            className="flex items-center gap-1.5 rounded-md border border-ink-500 px-3 py-2 text-sm text-parchment-dim hover:border-violet-400 hover:text-violet-300 disabled:opacity-50"
          >
            <History size={15} /> Ери
          </button>
          <button
            onClick={() => setIsArcManagerOpen(true)}
            disabled={!activeProjectId}
            className="flex items-center gap-1.5 rounded-md border border-ink-500 px-3 py-2 text-sm text-parchment-dim hover:border-sky-400 hover:text-sky-300 disabled:opacity-50"
          >
            <BookOpen size={15} /> Арки
          </button>
          <button
            onClick={() => setIsCausalityManagerOpen(true)}
            disabled={!activeProjectId || events.length < 2}
            className="flex items-center gap-1.5 rounded-md border border-ink-500 px-3 py-2 text-sm text-parchment-dim hover:border-amber-ink hover:text-amber-soft disabled:opacity-50"
          >
            <GitCommit size={15} /> Причинність
          </button>
          <button
            onClick={() => setIsBranchManagerOpen(true)}
            disabled={!activeProjectId}
            className="flex items-center gap-1.5 rounded-md border border-ink-500 px-3 py-2 text-sm text-parchment-dim hover:border-crimson-soft hover:text-crimson-soft disabled:opacity-50"
          >
            <GitBranch size={15} /> Гілки
          </button>
          <button
            onClick={() => {
              if (!activeProjectId) { toast.error('Спочатку оберіть активний проєкт'); return }
              setEditingEvent(null)
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft"
          >
            <Plus size={16} /> Нова подія
          </button>
        </div>
      </div>

      {/* Тіло */}
      <div className="mt-8">
        {!activeProjectId ? (
          <EmptyState icon={<Clock size={28} strokeWidth={1.5} className="text-parchment-dim" />}
            title="Проєкт не обрано"
            text="Таймлайн прив'язаний до конкретного проєкту. Оберіть або створіть проєкт." />

        ) : isLoading ? (
          <div className="flex items-center gap-2 text-parchment-dim">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Завантаження…</span>
          </div>

        ) : error ? (
          <div className="rounded-lg border border-crimson-dim bg-crimson-dim/10 px-5 py-4">
            <p className="text-sm text-crimson-soft">{error}</p>
            <button onClick={load} className="mt-2 text-xs text-crimson-soft underline">
              Спробувати знову
            </button>
          </div>

        ) : events.length === 0 ? (
          <EmptyState
            icon={<Clock size={28} strokeWidth={1.5} className="text-parchment-dim" />}
            title="Подій ще немає"
            text={`Додайте першу подію в таймлайн проєкту «${projectTitle}».`}
            action={
              <button onClick={() => setIsModalOpen(true)}
                className="mt-5 flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft">
                <Plus size={16} /> Додати подію
              </button>
            }
          />

        ) : (
          <>
            {branches.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-parchment-dim">Лінія:</span>
                <button onClick={() => setActiveLine('main')}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    activeLine === 'main' ? 'bg-amber-ink font-medium text-ink-900' : 'bg-ink-700 text-parchment-dim hover:bg-ink-500'
                  }`}>
                  Основна лінія
                </button>
                {branches.map((b) => (
                  <button key={b.id} onClick={() => setActiveLine(String(b.id))}
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs transition-colors ${
                      activeLine === String(b.id) ? 'bg-crimson-soft font-medium text-ink-900' : 'bg-ink-700 text-parchment-dim hover:bg-ink-500'
                    }`}>
                    <GitBranch size={11} /> {b.name}
                  </button>
                ))}
              </div>
            )}

            {/* Панель фільтрів */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-xs text-parchment-dim">
                Подій: <span className="text-parchment">{filtered.length}</span>
                {filtered.length !== lineEvents.length && ` / ${lineEvents.length}`}
              </span>

              <div className="ml-auto flex items-center gap-1 rounded-md border border-ink-500 p-0.5">
                <button onClick={() => setGroupBy('year')}
                  className={`rounded px-2.5 py-1 text-xs transition-colors ${
                    groupBy === 'year' ? 'bg-amber-ink text-ink-900' : 'text-parchment-dim hover:bg-ink-700'
                  }`}>
                  За роком
                </button>
                <button onClick={() => setGroupBy('era')}
                  disabled={eras.length === 0}
                  className={`rounded px-2.5 py-1 text-xs transition-colors disabled:opacity-40 ${
                    groupBy === 'era' ? 'bg-amber-ink text-ink-900' : 'text-parchment-dim hover:bg-ink-700'
                  }`}>
                  За ерою
                </button>
              </div>

              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  hasFilters
                    ? 'border-amber-ink text-amber-soft'
                    : 'border-ink-500 text-parchment-dim hover:border-ink-300'
                }`}
              >
                <Filter size={12} />
                Фільтри
                {hasFilters && <span className="ml-1 rounded-full bg-amber-ink px-1.5 text-ink-900">!</span>}
              </button>

              <button
                onClick={() => setSortAsc((v) => !v)}
                className="rounded-md border border-ink-500 px-3 py-1.5 text-xs text-parchment-dim hover:border-ink-300"
              >
                {sortAsc ? '↑ Від давнього' : '↓ Від нового'}
              </button>
            </div>

            {showFilters && (
              <div className="mb-6 flex flex-wrap gap-3 rounded-lg border border-ink-500 bg-ink-800 p-4">
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={inputCls}>
                  <option value="">Всі типи</option>
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={filterImportance} onChange={(e) => setFilterImportance(e.target.value)} className={inputCls}>
                  <option value="">Будь-яка важливість</option>
                  {IMPORTANCE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <select value={filterCharacter} onChange={(e) => setFilterCharacter(e.target.value)} className={inputCls}>
                  <option value="">Всі персонажі</option>
                  {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {eras.length > 0 && (
                  <select value={filterEra} onChange={(e) => setFilterEra(e.target.value)} className={inputCls}>
                    <option value="">Всі ери</option>
                    {eras.map((era) => <option key={era.id} value={era.id}>{era.name}</option>)}
                  </select>
                )}
                {arcs.length > 0 && (
                  <select value={filterArc} onChange={(e) => setFilterArc(e.target.value)} className={inputCls}>
                    <option value="">Всі арки</option>
                    {arcs.map((arc) => <option key={arc.id} value={arc.id}>{arc.title}</option>)}
                  </select>
                )}
                {hasFilters && (
                  <button onClick={clearFilters}
                    className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-parchment-dim hover:bg-ink-700">
                    <X size={12} /> Скинути
                  </button>
                )}
              </div>
            )}

            {/* Стрічка подій (згруповані по роках або ерах) */}
            {filtered.length === 0 ? (
              <p className="text-sm text-parchment-dim">Нічого не знайдено за вибраними фільтрами.</p>
            ) : (
              <div className="flex flex-col gap-8">
                {groupKeys.map((groupKey) => (
                  <div key={groupKey}>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-8 min-w-[80px] items-center justify-center rounded-full border border-amber-ink bg-amber-ink/10 px-3">
                        <span className="font-mono text-sm font-medium text-amber-soft">
                          {groupBy === 'year' && groupKey !== 'Без дати' && /^-?\d+$/.test(groupKey)
                            ? formatYear(Number(groupKey))
                            : groupKey}
                        </span>
                      </div>
                      <div className="h-px flex-1 bg-ink-500" />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {grouped[groupKey].map((ev) => (
                        <EventCard
                          key={ev.id}
                          event={ev}
                          characters={characters}
                          eras={eras}
                          arcs={arcs}
                          branches={branches}
                          onEdit={(ev) => { setEditingEvent(ev); setIsModalOpen(true) }}
                          onDelete={handleDeleteRequest}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Модалка створення/редагування події */}
      <Modal
        title={editingEvent ? 'Редагувати подію' : 'Нова подія'}
        isOpen={isModalOpen}
        onClose={closeEventModal}
        maxWidth="max-w-lg"
      >
        <EventForm
          initial={editingEvent}
          characters={characters}
          eras={eras}
          arcs={arcs}
          branches={branches}
          defaultEraId={!editingEvent ? prefill.era_id : null}
          defaultArcId={!editingEvent ? prefill.arc_id : null}
          defaultBranchId={!editingEvent ? (prefill.branch_id ?? (activeLine !== 'main' ? activeLine : null)) : null}
          projectId={activeProjectId}
          onSubmit={editingEvent
            ? (payload) => handleEdit(editingEvent.id, payload)
            : handleCreate
          }
          onCancel={closeEventModal}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Менеджери ер / арок / причинності / гілок — тепер з кнопкою "переглянути" на кожному рядку */}
      <EraManager
        isOpen={isEraManagerOpen}
        onClose={() => setIsEraManagerOpen(false)}
        projectId={activeProjectId}
        eras={eras}
        onChange={setEras}
        onView={(era) => { setIsEraManagerOpen(false); setViewingEra(era) }}
      />
      <ArcManager
        isOpen={isArcManagerOpen}
        onClose={() => setIsArcManagerOpen(false)}
        projectId={activeProjectId}
        arcs={arcs}
        characters={characters}
        onChange={setArcs}
        onView={(arc) => { setIsArcManagerOpen(false); setViewingArc(arc) }}
      />
      <CausalityManager
        isOpen={isCausalityManagerOpen}
        onClose={() => setIsCausalityManagerOpen(false)}
        events={events}
        causalities={causalities}
        onChange={setCausalities}
      />
      <BranchManager
        isOpen={isBranchManagerOpen}
        onClose={() => setIsBranchManagerOpen(false)}
        projectId={activeProjectId}
        branches={branches}
        mainEvents={events.filter((e) => !e.branch_id)}
        onChange={setBranches}
        onView={(branch) => { setIsBranchManagerOpen(false); setViewingBranch(branch) }}
      />

      {/* НОВЕ: детальні перегляди ери/арки/гілки з повним списком подій */}
      <EraDetailModal
        isOpen={!!viewingEra}
        onClose={() => setViewingEra(null)}
        era={viewingEra}
        events={events}
        characters={characters}
        eras={eras}
        arcs={arcs}
        branches={branches}
        onEditEvent={openEditFromDetail}
        onDeleteEvent={openDeleteFromDetail}
        onAddEvent={() => openAddEventFor({ era_id: viewingEra?.id })}
      />
      <ArcDetailModal
        isOpen={!!viewingArc}
        onClose={() => setViewingArc(null)}
        arc={viewingArc}
        events={events}
        characters={characters}
        eras={eras}
        arcs={arcs}
        branches={branches}
        onEditEvent={openEditFromDetail}
        onDeleteEvent={openDeleteFromDetail}
        onAddEvent={() => openAddEventFor({ arc_id: viewingArc?.id })}
      />
      <BranchDetailModal
        isOpen={!!viewingBranch}
        onClose={() => setViewingBranch(null)}
        branch={viewingBranch}
        events={events}
        characters={characters}
        eras={eras}
        arcs={arcs}
        branches={branches}
        onEditEvent={openEditFromDetail}
        onDeleteEvent={openDeleteFromDetail}
        onAddEvent={() => openAddEventFor({ branch_id: viewingBranch?.id })}
      />

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null, title: '' })}
        onConfirm={handleDeleteConfirm}
        title="Видалити подію?"
        message={`Ви впевнені, що хочете видалити «${confirmDelete.title}»? Цю дію не можна скасувати.`}
        confirmLabel="Видалити"
        isDangerous
      />
    </div>
  )
}

function EmptyState({ icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-ink-500 px-6 py-16 text-center">
      {icon}
      <h3 className="mt-4 font-display text-xl text-parchment">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-parchment-dim">{text}</p>
      {action}
    </div>
  )
}
