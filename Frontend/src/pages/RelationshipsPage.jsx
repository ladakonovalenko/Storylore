import { useState, useEffect, useCallback } from 'react'
import { Plus, Link2, Loader2, Users, List, Network } from 'lucide-react'
import toast from 'react-hot-toast'
import { getRelationships, createRelationship, updateRelationship, deleteRelationship } from '../api/relationships'
import { getCharacters } from '../api/characters'
import { useProject } from '../context/ProjectContext'
import RelationshipCard from '../components/relationships/RelationshipCard'
import RelationshipMap  from '../components/relationships/RelationshipMap'
import CreateRelationshipForm from '../components/relationships/CreateRelationshipForm'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import InkStroke from '../components/layout/InkStroke'

export default function RelationshipsPage() {
  const { activeProject, activeProjectId } = useProject()

  const [relationships, setRelationships] = useState([])
  const [characters,    setCharacters]    = useState([])
  const [isLoading,     setIsLoading]     = useState(false)
  const [isSubmitting,  setIsSubmitting]  = useState(false)
  const [error,         setError]         = useState(null)
  const [isModalOpen,   setIsModalOpen]   = useState(false)
  const [editingRel,    setEditingRel]    = useState(null)
  const [view,          setView]          = useState('list') // 'list' | 'map'
  const [filterType,    setFilterType]    = useState('')

  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, label: '' })

  const load = useCallback(async () => {
    if (!activeProjectId) { setRelationships([]); setCharacters([]); return }
    setIsLoading(true); setError(null)
    try {
      const [rels, chars] = await Promise.all([
        getRelationships({ project_id: activeProjectId }),
        getCharacters(activeProjectId),
      ])
      setRelationships(rels)
      setCharacters(chars)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [activeProjectId])

  useEffect(() => { load() }, [load])

  const handleCreate = async (payload) => {
    setIsSubmitting(true)
    try {
      const newRel = await createRelationship(payload)
      setRelationships((prev) => [newRel, ...prev])
      toast.success("Зв'язок створено")
      setIsModalOpen(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async (id, payload) => {
    try {
      const updated = await updateRelationship(id, payload)
      setRelationships((prev) => prev.map((r) => r.id === id ? updated : r))
      toast.success("Зв'язок оновлено")
      setEditingRel(null)
    } catch (err) {
      toast.error(err.message)
      throw err
    }
  }

  const handleDeleteRequest = (rel) => {
    const label = `${rel.character?.name ?? '?'} → ${rel.target?.name ?? '?'}`
    setConfirmDelete({ isOpen: true, id: rel.id, label })
  }

  const handleDeleteConfirm = async () => {
    const { id, label } = confirmDelete
    setConfirmDelete({ isOpen: false, id: null, label: '' })
    try {
      await deleteRelationship(id)
      setRelationships((prev) => prev.filter((r) => r.id !== id))
      toast.success(`Зв'язок «${label}» видалено`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const allTypes = [...new Set(relationships.map((r) => r.relationship_type))].sort()
  const filtered = filterType
    ? relationships.filter((r) => r.relationship_type === filterType)
    : relationships

  const projectTitle = activeProject?.title || activeProject?.name || null

  return (
    <div>
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-medium text-parchment">Зв'язки</h2>
          <InkStroke className="mt-1" width={80} />
          {projectTitle && (
            <p className="mt-2 text-sm text-parchment-dim">
              Проєкт: <span className="text-parchment">{projectTitle}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => {
            if (!activeProjectId) { toast.error('Спочатку оберіть активний проєкт'); return }
            if (characters.length < 2) { toast.error('Потрібно щонайменше 2 персонажі'); return }
            setEditingRel(null)
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft"
        >
          <Plus size={16} /> Новий зв'язок
        </button>
      </div>

      {/* Тіло */}
      <div className="mt-8">
        {!activeProjectId ? (
          <EmptyState icon={<Link2 size={28} strokeWidth={1.5} className="text-parchment-dim" />}
            title="Проєкт не обрано"
            text="Зв'язки прив'язані до конкретного проєкту. Оберіть або створіть проєкт." />

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

        ) : relationships.length === 0 ? (
          <EmptyState
            icon={<Users size={28} strokeWidth={1.5} className="text-parchment-dim" />}
            title="Зв'язків ще немає"
            text={`Створіть перший зв'язок між персонажами проєкту «${projectTitle}».`}
            action={characters.length >= 2
              ? <button onClick={() => setIsModalOpen(true)}
                  className="mt-5 flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft">
                  <Plus size={16} /> Створити зв'язок
                </button>
              : <p className="mt-3 text-xs text-parchment-dim/60">
                  Спочатку додайте щонайменше 2 персонажі
                </p>
            }
          />

        ) : (
          <>
            {/* Панель: статистика + фільтр + перемикач вигляду */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="text-xs text-parchment-dim">
                Усього: <span className="text-parchment">{relationships.length}</span>
              </span>

              {/* Фільтр (тільки для списку) */}
              {view === 'list' && allTypes.length > 1 && (
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setFilterType('')}
                    className={`rounded-full px-3 py-0.5 text-xs transition-colors ${
                      filterType === '' ? 'bg-amber-ink text-ink-900' : 'bg-ink-700 text-parchment-dim hover:bg-ink-500'
                    }`}>
                    Усі
                  </button>
                  {allTypes.map((t) => (
                    <button key={t} onClick={() => setFilterType(t === filterType ? '' : t)}
                      className={`rounded-full px-3 py-0.5 text-xs transition-colors ${
                        filterType === t ? 'bg-amber-ink text-ink-900' : 'bg-ink-700 text-parchment-dim hover:bg-ink-500'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {/* Перемикач список / карта */}
              <div className="ml-auto flex items-center gap-1 rounded-md border border-ink-500 p-0.5">
                <button onClick={() => setView('list')}
                  className={`flex items-center gap-1.5 rounded px-3 py-1 text-xs transition-colors ${
                    view === 'list' ? 'bg-ink-600 text-parchment' : 'text-parchment-dim hover:text-parchment'
                  }`}>
                  <List size={13} /> Список
                </button>
                <button onClick={() => setView('map')}
                  className={`flex items-center gap-1.5 rounded px-3 py-1 text-xs transition-colors ${
                    view === 'map' ? 'bg-ink-600 text-parchment' : 'text-parchment-dim hover:text-parchment'
                  }`}>
                  <Network size={13} /> Карта
                </button>
              </div>
            </div>

            {/* Список або карта */}
            {view === 'list' ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((rel) => (
                  <RelationshipCard
                    key={rel.id}
                    relationship={rel}
                    onEdit={(rel) => { setEditingRel(rel); setIsModalOpen(true) }}
                    onDelete={handleDeleteRequest}
                  />
                ))}
              </div>
            ) : (
              <RelationshipMap
                relationships={relationships}
                characters={characters}
              />
            )}
          </>
        )}
      </div>

      {/* Модалка */}
      <Modal
        title={editingRel ? "Редагувати зв'язок" : "Новий зв'язок"}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingRel(null) }}
        maxWidth="max-w-lg"
      >
        <CreateRelationshipForm
          characters={characters}
          initial={editingRel}
          onSubmit={editingRel
            ? (payload) => handleEdit(editingRel.id, payload)
            : handleCreate
          }
          onCancel={() => { setIsModalOpen(false); setEditingRel(null) }}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null, label: '' })}
        onConfirm={handleDeleteConfirm}
        title="Видалити зв'язок?"
        message={`Ви впевнені, що хочете видалити зв'язок «${confirmDelete.label}»? Цю дію не можна скасувати.`}
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
