import { useState, useCallback } from 'react'
import { X, Edit3, Check, Loader2, Trash2, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { updateCharacter } from '../../api/characters'
import { normalizeFields } from '../../utils/templateFields'
import { calcProgress } from '../../utils/progressHelpers'
import ProgressBar from './ProgressBar'
import ConfirmDialog from '../common/ConfirmDialog'
import InkStroke from '../layout/InkStroke'

const STATUS_MAP = {
  alive:    { label: 'Живий',    cls: 'text-moss-soft bg-moss-dim/20 ring-moss-soft' },
  deceased: { label: 'Загиблий', cls: 'text-crimson-soft bg-crimson-dim/20 ring-crimson-soft' },
  unknown:  { label: 'Невідомо', cls: 'text-parchment-dim bg-ink-500/40 ring-ink-300' },
}
const STATUS_OPTIONS = [
  { value: 'alive',    label: 'Живий' },
  { value: 'deceased', label: 'Загиблий' },
  { value: 'unknown',  label: 'Невідомо' },
]
const BASE_DETAIL_FIELDS = [
  { key: 'description', label: 'Опис',         type: 'textarea' },
  { key: 'background',  label: 'Передісторія', type: 'textarea' },
  { key: 'appearance',  label: 'Зовнішність',  type: 'textarea' },
  { key: 'motivation',  label: 'Мотивація',    type: 'textarea' },
  { key: 'notes',       label: 'Нотатки',      type: 'textarea' },
]
const SKIP_KEYS = new Set([
  'id', 'name', 'description', 'background', 'appearance', 'motivation', 'notes',
  'status', 'tags', 'template_key', 'project_id', 'created_at', 'updated_at',
])

// ── Inline-поле ──────────────────────────────────────────────────────────────
function InlineField({ label, value, fieldKey, type = 'text', onSave, isSaving }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')

  const commit = async () => {
    if (draft === (value ?? '')) { setEditing(false); return }
    await onSave(fieldKey, draft)
    setEditing(false)
  }
  const cancel = () => { setDraft(value ?? ''); setEditing(false) }

  return (
    <div className="group">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-parchment-dim/70">
          {label}
        </span>
        {!editing && (
          <button
            onClick={() => { setDraft(value ?? ''); setEditing(true) }}
            className="flex items-center gap-1 text-xs text-parchment-dim opacity-0 transition-all hover:text-amber-soft group-hover:opacity-100"
          >
            <Edit3 size={11} /> Редагувати
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          {type === 'textarea' ? (
            <textarea
              autoFocus value={draft} rows={4}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full resize-none rounded-md border border-amber-ink bg-ink-900 px-3 py-2 text-sm text-parchment focus:outline-none"
            />
          ) : (
            <input
              autoFocus value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full rounded-md border border-amber-ink bg-ink-900 px-3 py-2 text-sm text-parchment focus:outline-none"
            />
          )}
          <div className="flex justify-end gap-2">
            <button onClick={cancel}
              className="rounded px-3 py-1 text-xs text-parchment-dim hover:bg-ink-700">
              Скасувати
            </button>
            <button onClick={commit} disabled={isSaving}
              className="flex items-center gap-1 rounded bg-amber-ink px-3 py-1 text-xs font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
              {isSaving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
              Зберегти
            </button>
          </div>
        </div>
      ) : (
        <p
          className="min-h-[1.5rem] cursor-text text-sm text-parchment"
          onDoubleClick={() => { setDraft(value ?? ''); setEditing(true) }}
          title="Двічі клацніть для редагування"
        >
          {value || <span className="italic text-parchment-dim/60">Не вказано</span>}
        </p>
      )}
    </div>
  )
}

// ── Головний компонент ────────────────────────────────────────────────────────
export default function CharacterDetail({
  character: init, templateDetail, onClose, onUpdated, onDeleted,
}) {
  const [character, setCharacter] = useState(init)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { percent } = calcProgress(character, templateDetail)
  const status = STATUS_MAP[character.status] ?? STATUS_MAP.unknown

  const saveField = useCallback(async (key, value) => {
    setIsSaving(true)
    try {
      const updated = await updateCharacter(character.id, { ...character, [key]: value })
      setCharacter(updated)
      onUpdated?.(updated)
      toast.success('Збережено')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }, [character, onUpdated])

  const handleDelete = async () => {
    const { deleteCharacter } = await import('../../api/characters')
    try {
      await deleteCharacter(character.id)
      toast.success(`«${character.name}» видалено`)
      onDeleted?.(character.id)
      onClose()
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Динамічні поля шаблону
  const extraFields = templateDetail
    ? normalizeFields(templateDetail).filter(
        (f) => !SKIP_KEYS.has(f.key) &&
               ['text', 'textarea', 'string', '', undefined, null].includes(f.type)
      )
    : []

  return (
    <div className="flex flex-col gap-6">
      {/* Заголовок */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <User size={16} className="shrink-0 text-parchment-dim" />
            <h2 className="font-display text-2xl font-medium text-parchment truncate">
              {character.name}
            </h2>
          </div>
          <InkStroke className="mt-1" width={80} color="var(--amber-ink)" />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={() => setConfirmDelete(true)}
            className="rounded p-1.5 text-parchment-dim transition-colors hover:bg-crimson-dim/30 hover:text-crimson-soft"
            aria-label="Видалити">
            <Trash2 size={15} />
          </button>
          <button onClick={onClose}
            className="rounded p-1.5 text-parchment-dim transition-colors hover:bg-ink-700 hover:text-parchment"
            aria-label="Закрити">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Прогрес */}
      <ProgressBar percent={percent} />

      {/* Статус */}
      <div>
        <span className="text-xs font-medium uppercase tracking-widest text-parchment-dim/70">Статус</span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button key={opt.value}
              onClick={() => saveField('status', opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                character.status === opt.value
                  ? `${STATUS_MAP[opt.value].cls} ring-1`
                  : 'bg-ink-700 text-parchment-dim hover:bg-ink-500'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Теги */}
      <div>
        <span className="text-xs font-medium uppercase tracking-widest text-parchment-dim/70">Теги</span>
        <div className="mt-1 flex flex-wrap gap-1">
          {Array.isArray(character.tags) && character.tags.length > 0
            ? character.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-ink-700 px-2 py-0.5 text-xs text-parchment-dim">
                  {tag}
                </span>
              ))
            : <span className="text-sm italic text-parchment-dim/60">Без тегів</span>
          }
        </div>
      </div>

      {/* Базові текстові поля */}
      <div className="flex flex-col gap-5 border-t border-ink-500 pt-4">
        {BASE_DETAIL_FIELDS.map((f) => (
          <InlineField
            key={f.key} label={f.label} value={character[f.key] ?? ''}
            fieldKey={f.key} type={f.type} onSave={saveField} isSaving={isSaving}
          />
        ))}
      </div>

      {/* Поля шаблону */}
      {extraFields.length > 0 && (
        <div className="flex flex-col gap-5 border-t border-ink-500 pt-4">
          <span className="text-xs font-medium uppercase tracking-widest text-parchment-dim/70">
            Поля шаблону
          </span>
          {extraFields.map((f) => (
            <InlineField
              key={f.key} label={f.label} value={character[f.key] ?? ''}
              fieldKey={f.key} type={f.type === 'textarea' ? 'textarea' : 'text'}
              onSave={saveField} isSaving={isSaving}
            />
          ))}
        </div>
      )}

      {/* Мета */}
      <div className="border-t border-ink-500 pt-3 text-xs text-parchment-dim/60">
        {character.template_key && <p>Шаблон: {character.template_key}</p>}
        {character.project_id && <p>Проєкт ID: {character.project_id}</p>}
      </div>

      <ConfirmDialog
        isOpen={confirmDelete} onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete} title="Видалити персонажа?"
        message={`Ви впевнені, що хочете видалити «${character.name}»? Цю дію не можна скасувати.`}
        confirmLabel="Видалити" isDangerous
      />
    </div>
  )
}
