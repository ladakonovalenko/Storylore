import { useState, useCallback } from 'react'
import { X, Edit3, Check, Loader2, Trash2, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { updateCharacter, deleteCharacter } from '../../api/characters'
import { normalizeFields } from '../../utils/templateFields'
import { calcProgress, calcCategoryBreakdown } from '../../utils/progressHelpers'
import ProgressBar from './ProgressBar'
import RadarChart from './RadarChart'
import ConfirmDialog from '../common/ConfirmDialog'
import InkStroke from '../layout/InkStroke'
import LinkedText from '../common/LinkedText'

const STATUS_MAP = {
  'Живий':    { label: 'Живий',    cls: 'text-moss-soft bg-moss-dim/20 ring-moss-soft' },
  'Загиблий': { label: 'Загиблий', cls: 'text-crimson-soft bg-crimson-dim/20 ring-crimson-soft' },
  'Невідомо': { label: 'Невідомо', cls: 'text-parchment-dim bg-ink-500/40 ring-ink-300' },
}
const STATUS_OPTIONS = [
  { value: 'Живий',    label: 'Живий' },
  { value: 'Загиблий', label: 'Загиблий' },
  { value: 'Невідомо', label: 'Невідомо' },
]

const BASE_DETAIL_FIELDS = [
  { key: 'description',      label: 'Опис',         type: 'textarea' },
  { key: 'biography',        label: 'Передісторія', type: 'textarea' },
  { key: 'appearance',       label: 'Зовнішність',  type: 'textarea' },
  { key: 'motivation_goals', label: 'Мотивація',    type: 'textarea' },
  { key: 'notes',            label: 'Нотатки',      type: 'textarea' },
]

const EXTRA_DETAIL_FIELDS = [
  { key: 'character_traits',          label: 'Риси характеру',          type: 'textarea' },
  { key: 'fears_vulnerabilities',     label: 'Страхи та вразливості',   type: 'textarea' },
  { key: 'values_beliefs',            label: 'Цінності та переконання', type: 'textarea' },
  { key: 'self_perception',           label: 'Самосприйняття',          type: 'textarea' },
  { key: 'traumas',                   label: 'Травми',                  type: 'textarea' },
  { key: 'secrets',                   label: 'Таємниці',                type: 'textarea' },
  { key: 'family_origin',             label: 'Походження',              type: 'textarea' },
  { key: 'social_status',             label: 'Соціальний статус',       type: 'textarea' },
  { key: 'character_arc',             label: 'Арка персонажа',          type: 'textarea' },
  { key: 'unresolved_conflicts',      label: 'Невирішені конфлікти',    type: 'textarea' },
  { key: 'skills',                    label: 'Навички',                 type: 'textarea' },
  { key: 'resources',                 label: 'Ресурси',                 type: 'textarea' },
  { key: 'physical_limitations',      label: 'Фізичні обмеження',       type: 'textarea' },
  { key: 'psychological_limitations', label: 'Психологічні обмеження',  type: 'textarea' },
  { key: 'habits_routines',           label: 'Звички та розпорядок',    type: 'textarea' },
  { key: 'reputation',                label: 'Репутація',               type: 'textarea' },
  { key: 'communication_style',       label: 'Стиль спілкування',       type: 'textarea' },
  { key: 'allies_perception',         label: 'Сприйняття союзників',    type: 'textarea' },
  { key: 'enemies_perception',        label: 'Сприйняття ворогів',      type: 'textarea' },
  { key: 'contrasts',                 label: 'Контрасти',               type: 'textarea' },
  { key: 'symbols',                   label: 'Символи',                 type: 'textarea' },
]

const SKIP_KEYS = new Set([
  'id', 'name', 'description', 'biography', 'appearance', 'motivation_goals', 'notes',
  'status', 'tags', 'template_key', 'project_id', 'created_at', 'updated_at', 'image_url',
  ...EXTRA_DETAIL_FIELDS.map((f) => f.key),
])

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
          className="min-h-[1.5rem] cursor-text whitespace-pre-wrap text-sm text-parchment"
          onDoubleClick={() => { setDraft(value ?? ''); setEditing(true) }}
          title="Двічі клацніть для редагування"
        >
          {value ? <LinkedText text={value} /> : <span className="italic text-parchment-dim/60">Не вказано</span>}
        </p>
      )}
    </div>
  )
}

// НОВЕ: блок зображення персонажа — велике фото зверху з можливістю редагувати посилання
function ImageField({ imageUrl, onSave, isSaving }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(imageUrl ?? '')
  const [broken, setBroken] = useState(false)

  const commit = async () => {
    if (draft === (imageUrl ?? '')) { setEditing(false); return }
    await onSave('image_url', draft)
    setBroken(false)
    setEditing(false)
  }
  const cancel = () => { setDraft(imageUrl ?? ''); setEditing(false) }

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        <input
          autoFocus value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="https://i.pinimg.com/…"
          className="w-full rounded-md border border-amber-ink bg-ink-900 px-3 py-2 text-sm text-parchment focus:outline-none"
        />
        <div className="flex justify-end gap-2">
          <button onClick={cancel} className="rounded px-3 py-1 text-xs text-parchment-dim hover:bg-ink-700">
            Скасувати
          </button>
          <button onClick={commit} disabled={isSaving}
            className="flex items-center gap-1 rounded bg-amber-ink px-3 py-1 text-xs font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
            {isSaving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
            Зберегти
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group/img relative">
      {imageUrl && !broken ? (
        <img
          src={imageUrl} alt=""
          className="h-40 w-40 rounded-lg border border-ink-500 object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="flex h-40 w-40 items-center justify-center rounded-lg border border-dashed border-ink-500 bg-ink-900">
          <User size={32} className="text-parchment-dim/40" strokeWidth={1.5} />
        </div>
      )}
      <button
        onClick={() => { setDraft(imageUrl ?? ''); setEditing(true) }}
        className="absolute -bottom-2 -right-2 rounded-full bg-ink-700 p-1.5 text-parchment-dim opacity-0 shadow transition-opacity hover:text-amber-soft group-hover/img:opacity-100"
        aria-label="Редагувати зображення"
        title="Змінити зображення"
      >
        <Edit3 size={13} />
      </button>
    </div>
  )
}

export default function CharacterDetail({
  character: init, templateDetail, onClose, onUpdated, onDeleted,
}) {
  const [character, setCharacter] = useState(init)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showAllFields, setShowAllFields] = useState(false)

  const { percent } = calcProgress(character, templateDetail)
  const categoryBreakdown = calcCategoryBreakdown(character)
  const status = STATUS_MAP[character.status] ?? STATUS_MAP['Невідомо']

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
    try {
      await deleteCharacter(character.id)
      toast.success(`«${character.name}» видалено`)
      onDeleted?.(character.id)
      onClose()
    } catch (err) {
      toast.error(err.message)
    }
  }

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
        {/* НОВЕ: зображення персонажа поруч з іменем */}
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <ImageField imageUrl={character.image_url} onSave={saveField} isSaving={isSaving} />
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-center gap-2">
              <User size={16} className="shrink-0 text-parchment-dim" />
              <h2 className="font-display text-2xl font-medium text-parchment truncate">
                {character.name}
              </h2>
            </div>
            <InkStroke className="mt-1" width={80} color="var(--amber-ink)" />
          </div>
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

      <div>
        <span className="text-xs font-medium uppercase tracking-widest text-parchment-dim/70">
          Баланс анкети
        </span>
        <div className="mt-2">
          <RadarChart data={categoryBreakdown} />
        </div>
      </div>

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
          {(() => {
            const tagsList = Array.isArray(character.tags)
              ? character.tags
              : (character.tags ? character.tags.split(',').map((t) => t.trim()).filter(Boolean) : [])

            return tagsList.length > 0
              ? tagsList.map((tag) => (
                  <span key={tag} className="rounded-full bg-ink-700 px-2 py-0.5 text-xs text-parchment-dim">
                    {tag}
                  </span>
                ))
              : <span className="text-sm italic text-parchment-dim/60">Без тегів</span>
          })()}
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

      <div className="border-t border-ink-500 pt-4">
        <button
          onClick={() => setShowAllFields((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-parchment-dim/70 hover:text-amber-soft"
        >
          {showAllFields ? 'Сховати решту полів' : `Показати всі поля анкети (${EXTRA_DETAIL_FIELDS.length})`}
        </button>

        {showAllFields && (
          <div className="mt-4 flex flex-col gap-5">
            {EXTRA_DETAIL_FIELDS.map((f) => (
              <InlineField
                key={f.key} label={f.label} value={character[f.key] ?? ''}
                fieldKey={f.key} type={f.type} onSave={saveField} isSaving={isSaving}
              />
            ))}
          </div>
        )}
      </div>

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
