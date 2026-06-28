import { useState, useEffect, useCallback } from 'react'
import { Plus, Loader2, Trash2, X, Link2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProject } from '../context/ProjectContext'
import { getProjectLocations, createLocation, updateLocation, deleteLocation } from '../api/locations'
import {
  getProjectLocationRelationships, createLocationRelationship,
  updateLocationRelationship, deleteLocationRelationship,
} from '../api/locationRelationships'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import InkStroke from '../components/layout/InkStroke'
import WorldMapCanvas, { LOCATION_TYPE_COLORS, LOCATION_REL_TYPE_COLORS } from '../components/worldmap/WorldMapCanvas'

const TYPE_OPTIONS = Object.keys(LOCATION_TYPE_COLORS)
const REL_TYPE_OPTIONS = Object.keys(LOCATION_REL_TYPE_COLORS)

const inputCls =
  'mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none'

// ── Форма створення/редагування локації ──────────────────────────────────────
function LocationForm({ initial, onSubmit, onCancel, isSubmitting }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState(initial?.type ?? 'Країна')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [touched, setTouched] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!name.trim()) return
    onSubmit({ name: name.trim(), type, description: description.trim() || null })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="block text-sm text-parchment-dim">
        Назва <span className="text-crimson-soft">*</span>
        <input
          autoFocus value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Вестерос, Острів Скай…" className={inputCls}
        />
        {touched && !name.trim() && (
          <span className="mt-1 block text-xs text-crimson-soft">Назва обов'язкова</span>
        )}
      </label>

      <label className="block text-sm text-parchment-dim">
        Тип
        <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
          {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>

      <label className="block text-sm text-parchment-dim">
        Опис
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)}
          rows={4} placeholder="Клімат, культура, важливі події…"
          className={`${inputCls} resize-none`}
        />
      </label>

      <div className="mt-1 flex justify-end gap-2">
        <button type="button" onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm text-parchment-dim hover:bg-ink-700">
          Скасувати
        </button>
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {initial ? 'Зберегти зміни' : 'Створити'}
        </button>
      </div>
    </form>
  )
}

// ── Форма створення/редагування зв'язку між локаціями ────────────────────────
function RelationshipForm({ sourceName, targetName, initial, onSubmit, onCancel, isSubmitting }) {
  const [type, setType] = useState(initial?.relationship_type ?? 'Союз')
  const [strength, setStrength] = useState(initial?.strength ?? 0)
  const [description, setDescription] = useState(initial?.description ?? '')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      relationship_type: type,
      strength: Number(strength) || 0,
      description: description.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {sourceName && targetName && (
        <p className="text-sm text-parchment-dim">
          <span className="text-parchment">{sourceName}</span>
          {' '}→{' '}
          <span className="text-parchment">{targetName}</span>
        </p>
      )}

      <label className="block text-sm text-parchment-dim">
        Тип зв'язку
        <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
          {REL_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>

      <label className="block text-sm text-parchment-dim">
        Сила зв'язку ({strength})
        <input
          type="range" min={-100} max={100} value={strength}
          onChange={(e) => setStrength(e.target.value)}
          className="mt-2 w-full"
        />
      </label>

      <label className="block text-sm text-parchment-dim">
        Причина / опис
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)}
          rows={4} placeholder="Чому ці землі союзні чи ворогують…"
          className={`${inputCls} resize-none`}
        />
      </label>

      <div className="mt-1 flex justify-end gap-2">
        <button type="button" onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm text-parchment-dim hover:bg-ink-700">
          Скасувати
        </button>
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {initial ? 'Зберегти зміни' : 'Створити зв\u2019язок'}
        </button>
      </div>
    </form>
  )
}

// ── Бічна панель деталей локації ──────────────────────────────────────────────
function LocationDetailPanel({ location, onClose, onEdit, onDelete }) {
  if (!location) return null
  const color = location.color || LOCATION_TYPE_COLORS[location.type] || '#888780'

  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border border-ink-500 bg-ink-800 p-5 lg:w-72">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs uppercase tracking-widest text-parchment-dim/70">{location.type}</span>
          </div>
          <h3 className="mt-2 font-display text-xl font-medium text-parchment">{location.name}</h3>
          <InkStroke className="mt-1" width={60} color="var(--amber-ink)" />
        </div>
        <button onClick={onClose}
          className="rounded p-1.5 text-parchment-dim transition-colors hover:bg-ink-700 hover:text-parchment"
          aria-label="Закрити">
          <X size={15} />
        </button>
      </div>

      <p className="text-sm text-parchment-dim">
        {location.description || <span className="italic text-parchment-dim/60">Без опису</span>}
      </p>

      <div className="flex justify-end gap-2 border-t border-ink-500 pt-3">
        <button onClick={onDelete}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-crimson-soft hover:bg-crimson-dim/20">
          <Trash2 size={14} /> Видалити
        </button>
        <button onClick={onEdit}
          className="rounded-md border border-ink-500 px-3 py-1.5 text-sm text-parchment hover:border-amber-ink hover:text-amber-soft">
          Редагувати
        </button>
      </div>
    </div>
  )
}

// ── Бічна панель деталей зв'язку ──────────────────────────────────────────────
function RelationshipDetailPanel({ relationship, sourceName, targetName, onClose, onEdit, onDelete }) {
  if (!relationship) return null
  const color = LOCATION_REL_TYPE_COLORS[relationship.relationship_type] || '#888780'

  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border border-ink-500 bg-ink-800 p-5 lg:w-72">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs uppercase tracking-widest text-parchment-dim/70">
              {relationship.relationship_type}
            </span>
          </div>
          <h3 className="mt-2 font-display text-lg font-medium text-parchment">
            {sourceName} → {targetName}
          </h3>
          <InkStroke className="mt-1" width={60} color="var(--amber-ink)" />
        </div>
        <button onClick={onClose}
          className="rounded p-1.5 text-parchment-dim transition-colors hover:bg-ink-700 hover:text-parchment"
          aria-label="Закрити">
          <X size={15} />
        </button>
      </div>

      <p className="text-xs text-parchment-dim">
        Сила: <span className="text-parchment">{relationship.strength}</span>
      </p>

      <p className="text-sm text-parchment-dim">
        {relationship.description || <span className="italic text-parchment-dim/60">Без опису</span>}
      </p>

      <div className="flex justify-end gap-2 border-t border-ink-500 pt-3">
        <button onClick={onDelete}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-crimson-soft hover:bg-crimson-dim/20">
          <Trash2 size={14} /> Видалити
        </button>
        <button onClick={onEdit}
          className="rounded-md border border-ink-500 px-3 py-1.5 text-sm text-parchment hover:border-amber-ink hover:text-amber-soft">
          Редагувати
        </button>
      </div>
    </div>
  )
}

// ── Головна сторінка ──────────────────────────────────────────────────────────
export default function WorldMapPage() {
  const { activeProjectId } = useProject()

  const [locations, setLocations] = useState([])
  const [relationships, setRelationships] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [deletingLocation, setDeletingLocation] = useState(null)

  // Режим з'єднання локацій
  const [linkMode, setLinkMode] = useState(false)
  const [linkSourceId, setLinkSourceId] = useState(null)
  const [pendingLink, setPendingLink] = useState(null) // { sourceId, targetId }

  const [selectedRel, setSelectedRel] = useState(null)
  const [editingRel, setEditingRel] = useState(null)
  const [deletingRel, setDeletingRel] = useState(null)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadAll = useCallback(async () => {
    if (!activeProjectId) { setLocations([]); setRelationships([]); setIsLoading(false); return }
    setIsLoading(true)
    setError(null)
    try {
      const [locs, rels] = await Promise.all([
        getProjectLocations(activeProjectId),
        getProjectLocationRelationships(activeProjectId),
      ])
      setLocations(locs)
      setRelationships(rels)
    } catch (err) {
      setError('Не вдалося завантажити мапу. Перевірте, чи запущено бекенд на http://127.0.0.1:8001')
    } finally {
      setIsLoading(false)
    }
  }, [activeProjectId])

  useEffect(() => { loadAll() }, [loadAll])

  const findLocationName = (id) => locations.find((l) => l.id === id)?.name ?? '—'

  // ── Локації ──
  const handleCreate = async (payload) => {
    setIsSubmitting(true)
    try {
      const created = await createLocation({
        ...payload,
        project_id: activeProjectId,
        x: 400 + Math.random() * 40 - 20,
        y: 300 + Math.random() * 40 - 20,
      })
      setLocations((prev) => [...prev, created])
      toast.success(`«${created.name}» додано на мапу`)
      setIsCreateOpen(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (payload) => {
    if (!editingLocation) return
    setIsSubmitting(true)
    try {
      const updated = await updateLocation(editingLocation.id, payload)
      setLocations((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
      setSelectedLocation(updated)
      toast.success('Збережено')
      setEditingLocation(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteLocation = async () => {
    if (!deletingLocation) return
    try {
      await deleteLocation(deletingLocation.id)
      setLocations((prev) => prev.filter((l) => l.id !== deletingLocation.id))
      setRelationships((prev) => prev.filter(
        (r) => r.location_id !== deletingLocation.id && r.target_id !== deletingLocation.id
      ))
      if (selectedLocation?.id === deletingLocation.id) setSelectedLocation(null)
      toast.success(`«${deletingLocation.name}» видалено з мапи`)
      setDeletingLocation(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleNodeDragEnd = useCallback((id, x, y, shouldPersist) => {
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, x, y } : l)))
    if (shouldPersist) {
      updateLocation(id, { x, y }).catch(() => toast.error('Не вдалося зберегти позицію'))
    }
  }, [])

  // ── Клік по вузлу: або вибір для з'єднання, або відкриття деталей ──
  const handleNodeClick = (loc) => {
    if (linkMode) {
      if (!linkSourceId) {
        setLinkSourceId(loc.id)
        return
      }
      if (linkSourceId === loc.id) {
        setLinkSourceId(null) // повторний клік на той самий вузол — скасувати вибір
        return
      }
      setPendingLink({ sourceId: linkSourceId, targetId: loc.id })
      setLinkSourceId(null)
      setLinkMode(false)
      return
    }
    setSelectedRel(null)
    setSelectedLocation(loc)
  }

  // ── Зв'язки ──
  const handleCreateRelationship = async (payload) => {
    if (!pendingLink) return
    setIsSubmitting(true)
    try {
      const created = await createLocationRelationship({
        ...payload,
        location_id: pendingLink.sourceId,
        target_id: pendingLink.targetId,
      })
      setRelationships((prev) => [...prev, created])
      toast.success('Зв\u2019язок створено')
      setPendingLink(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateRelationship = async (payload) => {
    if (!editingRel) return
    setIsSubmitting(true)
    try {
      const updated = await updateLocationRelationship(editingRel.id, payload)
      setRelationships((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      setSelectedRel(updated)
      toast.success('Збережено')
      setEditingRel(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteRelationship = async () => {
    if (!deletingRel) return
    try {
      await deleteLocationRelationship(deletingRel.id)
      setRelationships((prev) => prev.filter((r) => r.id !== deletingRel.id))
      if (selectedRel?.id === deletingRel.id) setSelectedRel(null)
      toast.success('Зв\u2019язок видалено')
      setDeletingRel(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const toggleLinkMode = () => {
    setLinkMode((v) => !v)
    setLinkSourceId(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-medium text-parchment">Мапа світу</h2>
          <InkStroke className="mt-1" width={90} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLinkMode}
            disabled={!activeProjectId || locations.length < 2}
            className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50 ${
              linkMode
                ? 'border-amber-ink bg-amber-ink/15 text-amber-soft'
                : 'border-ink-500 text-parchment hover:border-amber-ink hover:text-amber-soft'
            }`}
          >
            <Link2 size={16} />
            {linkMode ? 'Скасувати з\u2019єднання' : 'З\u2019єднати об\u2019єкти'}
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            disabled={!activeProjectId}
            className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-50"
          >
            <Plus size={16} />
            Новий об'єкт
          </button>
        </div>
      </div>

      {linkMode && (
        <p className="mt-3 text-sm text-amber-soft">
          {linkSourceId
            ? `Оберіть другий об'єкт, щоб з'єднати його з «${findLocationName(linkSourceId)}»`
            : 'Клацніть на першому об\u2019єкті, щоб почати з\u2019єднання'}
        </p>
      )}

      {!activeProjectId ? (
        <p className="mt-6 text-sm text-parchment-dim">
          Оберіть активний проєкт на сторінці «Проєкти», щоб почати наповнювати мапу.
        </p>
      ) : isLoading ? (
        <div className="mt-8 h-[560px] animate-pulse rounded-lg border border-ink-500 bg-ink-800" />
      ) : error ? (
        <div className="mt-6 rounded-lg border border-crimson-soft/40 bg-crimson-dim/10 px-5 py-4 text-sm text-crimson-soft">
          {error}
          <button onClick={loadAll} className="ml-3 underline hover:no-underline">
            Спробувати знову
          </button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <WorldMapCanvas
              locations={locations}
              relationships={relationships}
              selectedId={selectedLocation?.id}
              linkSourceId={linkSourceId}
              onNodeClick={handleNodeClick}
              onNodeDragEnd={handleNodeDragEnd}
              onEdgeClick={(rel) => { setSelectedLocation(null); setSelectedRel(rel) }}
            />
          </div>
          {selectedLocation && (
            <LocationDetailPanel
              location={selectedLocation}
              onClose={() => setSelectedLocation(null)}
              onEdit={() => setEditingLocation(selectedLocation)}
              onDelete={() => setDeletingLocation(selectedLocation)}
            />
          )}
          {selectedRel && (
            <RelationshipDetailPanel
              relationship={selectedRel}
              sourceName={findLocationName(selectedRel.location_id)}
              targetName={findLocationName(selectedRel.target_id)}
              onClose={() => setSelectedRel(null)}
              onEdit={() => setEditingRel(selectedRel)}
              onDelete={() => setDeletingRel(selectedRel)}
            />
          )}
        </div>
      )}

      {/* Модалка створення локації */}
      <Modal title="Новий об'єкт на мапі" isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <LocationForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Модалка редагування локації */}
      <Modal title="Редагувати об'єкт" isOpen={!!editingLocation} onClose={() => setEditingLocation(null)}>
        <LocationForm
          initial={editingLocation}
          onSubmit={handleUpdate}
          onCancel={() => setEditingLocation(null)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Модалка створення зв'язку (після вибору двох об'єктів) */}
      <Modal title="Новий зв'язок" isOpen={!!pendingLink} onClose={() => setPendingLink(null)}>
        <RelationshipForm
          sourceName={pendingLink && findLocationName(pendingLink.sourceId)}
          targetName={pendingLink && findLocationName(pendingLink.targetId)}
          onSubmit={handleCreateRelationship}
          onCancel={() => setPendingLink(null)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Модалка редагування зв'язку */}
      <Modal title="Редагувати зв'язок" isOpen={!!editingRel} onClose={() => setEditingRel(null)}>
        <RelationshipForm
          sourceName={editingRel && findLocationName(editingRel.location_id)}
          targetName={editingRel && findLocationName(editingRel.target_id)}
          initial={editingRel}
          onSubmit={handleUpdateRelationship}
          onCancel={() => setEditingRel(null)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Підтвердження видалення локації */}
      <ConfirmDialog
        isOpen={!!deletingLocation}
        onClose={() => setDeletingLocation(null)}
        onConfirm={handleDeleteLocation}
        title="Видалити об'єкт з мапи?"
        message={`Ви впевнені, що хочете видалити «${deletingLocation?.name}»? Усі зв'язки цього об'єкта також буде видалено.`}
        confirmLabel="Видалити"
        isDangerous
      />

      {/* Підтвердження видалення зв'язку */}
      <ConfirmDialog
        isOpen={!!deletingRel}
        onClose={() => setDeletingRel(null)}
        onConfirm={handleDeleteRelationship}
        title="Видалити зв'язок?"
        message="Ви впевнені, що хочете видалити цей зв'язок? Цю дію не можна скасувати."
        confirmLabel="Видалити"
        isDangerous
      />
    </div>
  )
}
