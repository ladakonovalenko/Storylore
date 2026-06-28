import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, Clock, GitBranch, Loader2, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'

import {
  getRelationships,
  createRelationship,
  updateRelationship,
  deleteRelationship,
} from '../api/relationships'
import { getCharacters } from '../api/characters'

import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import InkStroke from '../components/layout/InkStroke'
import RelationshipForm from '../components/relationships/RelationshipForm'
import RelationshipHistoryModal from '../components/relationships/RelationshipHistoryModal'
import StrengthBadge from '../components/relationships/StrengthBadge'

// ── Лейбли ───────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  friend:       'Друг',
  enemy:        'Ворог',
  lover:        'Коханий/а',
  family:       'Родич',
  mentor:       'Наставник',
  rival:        'Суперник',
  ally:         'Союзник',
  knows_secret: 'Знає секрет',
  secret:       'Таємний',
  neutral:      'Нейтральний',
  other:        'Інший',
}

const STATUS_LABELS = {
  active:   { label: 'Активний',      cls: 'text-moss-soft bg-moss-dim/20' },
  broken:   { label: 'Розірваний',    cls: 'text-crimson-soft bg-crimson-dim/20' },
  hidden:   { label: 'Прихований',    cls: 'text-amber-soft bg-amber-ink/15' },
  evolving: { label: 'Розвивається',  cls: 'text-parchment bg-ink-500/60' },
}

// ── Допоміжна: ім'я персонажа за id ─────────────────────────────────────────
function charName(characters, id) {
  const c = characters.find((ch) => String(ch.id) === String(id))
  return c?.name || `#${id}`
}

// ── Головна сторінка ──────────────────────────────────────────────────────────
export default function RelationshipsPage() {
  const [relationships, setRelationships] = useState([])
  const [characters, setCharacters]       = useState([])
  const [isLoading, setIsLoading]         = useState(true)
  const [isSubmitting, setIsSubmitting]   = useState(false)
  const [error, setError]                 = useState(null)

  // Пошук (фронтенд)
  const [search, setSearch] = useState('')

  // Модалки
  const [createOpen, setCreateOpen]       = useState(false)
  const [editTarget, setEditTarget]       = useState(null)   // relationship object
  const [deleteTarget, setDeleteTarget]   = useState(null)   // relationship object
  const [historyTarget, setHistoryTarget] = useState(null)   // relationship object

  // ── Завантаження ────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setIsLoading(true); setError(null)
    try {
      const [rels, chars] = await Promise.all([getRelationships(), getCharacters()])
      setRelationships(rels)
      setCharacters(chars)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Фільтрація (фронтенд) ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return relationships
    const q = search.toLowerCase()
    return relationships.filter((r) => {
      const src  = charName(characters, r.source_character_id).toLowerCase()
      const tgt  = charName(characters, r.target_character_id).toLowerCase()
      const type = (TYPE_LABELS[r.type] || r.type || '').toLowerCase()
      const desc = (r.description || '').toLowerCase()
      return src.includes(q) || tgt.includes(q) || type.includes(q) || desc.includes(q)
    })
  }, [relationships, characters, search])

  // ── CRUD ────────────────────────────────────────────────────────────────────
  const handleCreate = async (payload) => {
    setIsSubmitting(true)
    try {
      const created = await createRelationship(payload)
      setRelationships((p) => [created, ...p])
      toast.success('Зв\'язок створено')
      setCreateOpen(false)
    } catch (err) { toast.error(err.message) }
    finally { setIsSubmitting(false) }
  }

  const handleEdit = async (payload) => {
    if (!editTarget) return
    setIsSubmitting(true)
    try {
      const updated = await updateRelationship(editTarget.id, payload)
      setRelationships((p) => p.map((r) => r.id === updated.id ? updated : r))
      toast.success('Зв\'язок оновлено')
      setEditTarget(null)
    } catch (err) { toast.error(err.message) }
    finally { setIsSubmitting(false) }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteRelationship(deleteTarget.id)
      setRelationships((p) => p.filter((r) => r.id !== deleteTarget.id))
      toast.success('Зв\'язок видалено')
    } catch (err) { toast.error(err.message) }
    finally { setDeleteTarget(null) }
  }

  // ── Рендер ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col">

      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-medium text-parchment">Зв'язки</h2>
          <InkStroke className="mt-1" width={80} />
          <p className="mt-2 text-sm text-parchment-dim">
            Стосунки між персонажами та їхня еволюція.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft"
        >
          <Plus size={16} /> Новий зв'язок
        </button>
      </div>

      {/* Пошук */}
      <div className="relative mt-6 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-parchment-dim" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Пошук за іменами, типом, описом…"
          className="w-full rounded-md border border-ink-500 bg-ink-800 py-2 pl-9 pr-9 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-parchment-dim hover:text-parchment">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Контент */}
      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-parchment-dim">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Завантаження…</span>
          </div>

        ) : error ? (
          <div className="rounded-lg border border-crimson-dim bg-crimson-dim/10 px-5 py-4">
            <p className="text-sm text-crimson-soft">{error}</p>
            <button onClick={load} className="mt-2 text-xs text-crimson-soft underline hover:no-underline">
              Спробувати знову
            </button>
          </div>

        ) : relationships.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-ink-500 px-6 py-16 text-center">
            <GitBranch size={28} strokeWidth={1.5} className="text-parchment-dim" />
            <h3 className="mt-4 font-display text-xl text-parchment">Зв'язків ще немає</h3>
            <p className="mt-2 max-w-sm text-sm text-parchment-dim">
              Створіть перший зв'язок між персонажами.
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-5 flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft"
            >
              <Plus size={16} /> Створити зв'язок
            </button>
          </div>

        ) : (
          <>
            {/* Лічильник */}
            <p className="mb-3 text-xs text-parchment-dim">
              {search
                ? `Знайдено: ${filtered.length} з ${relationships.length}`
                : `Усього зв'язків: ${relationships.length}`}
            </p>

            {/* Таблиця */}
            <div className="overflow-x-auto rounded-lg border border-ink-500">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-500 bg-ink-800">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-parchment-dim">
                      Від кого
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-parchment-dim">
                      До кого
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-parchment-dim">
                      Тип
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-parchment-dim">
                      Сила
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-parchment-dim">
                      Статус
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-parchment-dim hidden xl:table-cell">
                      Опис
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-parchment-dim">
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(search ? filtered : relationships).map((rel, i) => {
                    const srcName = charName(characters, rel.source_character_id)
                    const tgtName = charName(characters, rel.target_character_id)
                    const typeLabel = TYPE_LABELS[rel.type] || rel.type || '—'
                    const statusInfo = STATUS_LABELS[rel.status]

                    return (
                      <tr
                        key={rel.id}
                        className={`border-b border-ink-500/50 transition-colors hover:bg-ink-800/60 ${
                          i % 2 === 0 ? 'bg-ink-900' : 'bg-ink-800/30'
                        }`}
                      >
                        {/* Від кого */}
                        <td className="px-4 py-3 font-medium text-parchment">
                          {srcName}
                        </td>

                        {/* До кого */}
                        <td className="px-4 py-3 text-parchment">
                          {tgtName}
                        </td>

                        {/* Тип */}
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-ink-700 px-2.5 py-0.5 text-xs text-parchment-dim">
                            {typeLabel}
                          </span>
                        </td>

                        {/* Сила */}
                        <td className="px-4 py-3 text-center">
                          <StrengthBadge strength={rel.strength} />
                        </td>

                        {/* Статус */}
                        <td className="px-4 py-3">
                          {statusInfo ? (
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.cls}`}>
                              {statusInfo.label}
                            </span>
                          ) : (
                            <span className="text-parchment-dim">{rel.status || '—'}</span>
                          )}
                        </td>

                        {/* Опис */}
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <p className="max-w-xs truncate text-parchment-dim" title={rel.description}>
                            {rel.description || <span className="italic text-parchment-dim/50">—</span>}
                          </p>
                        </td>

                        {/* Дії */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {/* Еволюція */}
                            <button
                              onClick={() => setHistoryTarget(rel)}
                              title="Додати запис еволюції"
                              className="rounded p-1.5 text-parchment-dim hover:bg-ink-700 hover:text-amber-soft transition-colors"
                            >
                              <Clock size={14} />
                            </button>
                            {/* Редагувати */}
                            <button
                              onClick={() => setEditTarget(rel)}
                              title="Редагувати"
                              className="rounded p-1.5 text-parchment-dim hover:bg-ink-700 hover:text-parchment transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            {/* Видалити */}
                            <button
                              onClick={() => setDeleteTarget(rel)}
                              title="Видалити"
                              className="rounded p-1.5 text-parchment-dim hover:bg-crimson-dim/30 hover:text-crimson-soft transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Модалки ─────────────────────────────────────────────────────────── */}

      {/* Створити */}
      <Modal
        title="Новий зв'язок"
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="max-w-xl"
      >
        <RelationshipForm
          characters={characters}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Редагувати */}
      <Modal
        title="Редагувати зв'язок"
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        maxWidth="max-w-xl"
      >
        {editTarget && (
          <RelationshipForm
            initial={editTarget}
            characters={characters}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>

      {/* Еволюція */}
      <RelationshipHistoryModal
        relationship={historyTarget}
        sourceLabel={historyTarget ? charName(characters, historyTarget.source_character_id) : ''}
        targetLabel={historyTarget ? charName(characters, historyTarget.target_character_id) : ''}
        isOpen={!!historyTarget}
        onClose={() => setHistoryTarget(null)}
        onAdded={() => {}}
      />

      {/* Підтвердження видалення */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Видалити зв'язок?"
        message={
          deleteTarget
            ? `Видалити зв'язок між «${charName(characters, deleteTarget.source_character_id)}» і «${charName(characters, deleteTarget.target_character_id)}»? Цю дію не можна скасувати.`
            : ''
        }
        confirmLabel="Видалити"
        isDangerous
      />
    </div>
  )
}
