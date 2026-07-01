import { useState } from 'react'
import { Shield, Edit3, Trash2, Check, Loader2, X, Users } from 'lucide-react'
import InkStroke from '../layout/InkStroke'
import LinkedText from '../common/LinkedText'

export default function FactionCard({ faction, characters = [], onEdit, onAssignCharacters, onDelete }) {
  const name        = faction.name        || faction.title   || 'Без назви'
  const description = faction.description || faction.summary || ''

  const members = characters.filter((c) => c.faction_id === faction.id)

  const [editing, setEditing]     = useState(false)
  const [isSaving, setIsSaving]   = useState(false)
  const [imgBroken, setImgBroken] = useState(false) // НОВЕ
  const [draft, setDraft]         = useState({
    name:        faction.name        || '',
    description: faction.description || '',
    type:        faction.type        || '',
    alignment:   faction.alignment   || '',
    leader:      faction.leader      || '',
    image_url:   faction.image_url   || '', // НОВЕ
    characterIds: members.map((c) => c.id),
  })

  const startEditing = () => {
    setDraft({
      name:        faction.name        || '',
      description: faction.description || '',
      type:        faction.type        || '',
      alignment:   faction.alignment   || '',
      leader:      faction.leader      || '',
      image_url:   faction.image_url   || '', // НОВЕ
      characterIds: characters.filter((c) => c.faction_id === faction.id).map((c) => c.id),
    })
    setEditing(true)
  }

  const toggleCharacter = (id) => {
    setDraft((p) => ({
      ...p,
      characterIds: p.characterIds.includes(id)
        ? p.characterIds.filter((c) => c !== id)
        : [...p.characterIds, id],
    }))
  }

  const handleSave = async () => {
    if (!draft.name.trim()) return
    setIsSaving(true)
    try {
      await onEdit(faction.id, {
        name:        draft.name.trim(),
        description: draft.description.trim() || undefined,
        type:        draft.type.trim()        || undefined,
        alignment:   draft.alignment.trim()   || undefined,
        leader:      draft.leader.trim()      || undefined,
        image_url:   draft.image_url.trim()   || undefined, // НОВЕ
      })
      await onAssignCharacters?.(faction.id, draft.characterIds)
      setImgBroken(false)
      setEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
  }

  const inputCls =
    'mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-1.5 text-sm text-parchment focus:border-amber-ink focus:outline-none'

  // ── Режим редагування ────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-amber-ink bg-ink-800 px-5 py-4">
        <label className="block text-xs text-parchment-dim">
          Назва <span className="text-crimson-soft">*</span>
          <input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
            className={inputCls} />
        </label>

        {/* НОВЕ: зображення/герб */}
        <div className="flex flex-col gap-1">
          <label className="block text-xs text-parchment-dim">
            Посилання на зображення / герб
            <input value={draft.image_url} onChange={(e) => setDraft((p) => ({ ...p, image_url: e.target.value }))}
              placeholder="https://i.pinimg.com/…" className={inputCls} />
          </label>
          {draft.image_url && (
            <img
              src={draft.image_url} alt=""
              className="mt-1 h-20 w-20 rounded-md border border-ink-500 object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
              onLoad={(e) => { e.target.style.display = 'block' }}
            />
          )}
        </div>

        <label className="block text-xs text-parchment-dim">
          Опис
          <textarea value={draft.description} rows={3}
            onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
            className={`${inputCls} resize-none`} />
        </label>
        <label className="block text-xs text-parchment-dim">
          Тип
          <input value={draft.type} onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value }))}
            className={inputCls} />
        </label>
        <label className="block text-xs text-parchment-dim">
          Мировладання
          <input value={draft.alignment} onChange={(e) => setDraft((p) => ({ ...p, alignment: e.target.value }))}
            className={inputCls} />
        </label>
        <label className="block text-xs text-parchment-dim">
          Лідер
          <input value={draft.leader} onChange={(e) => setDraft((p) => ({ ...p, leader: e.target.value }))}
            className={inputCls} />
        </label>

        <div className="block text-xs text-parchment-dim">
          Персонажі фракції
          {characters.length === 0 ? (
            <p className="mt-1 text-xs italic text-parchment-dim/60">
              У цьому проєкті ще немає персонажів
            </p>
          ) : (
            <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-ink-500 bg-ink-900 p-2">
              {characters.map((c) => {
                const inAnotherFaction = c.faction_id != null && c.faction_id !== faction.id
                return (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-parchment hover:bg-ink-700"
                  >
                    <input
                      type="checkbox"
                      checked={draft.characterIds.includes(c.id)}
                      onChange={() => toggleCharacter(c.id)}
                      className="accent-amber-ink"
                    />
                    <span className="flex-1">{c.name}</span>
                    {inAnotherFaction && (
                      <span className="text-xs text-parchment-dim/60">в іншій фракції</span>
                    )}
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-ink-500 pt-3">
          <button onClick={handleCancel}
            className="flex items-center gap-1 rounded px-3 py-1.5 text-xs text-parchment-dim hover:bg-ink-700">
            <X size={12} /> Скасувати
          </button>
          <button onClick={handleSave} disabled={isSaving || !draft.name.trim()}
            className="flex items-center gap-1 rounded bg-amber-ink px-3 py-1.5 text-xs font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            Зберегти
          </button>
        </div>
      </div>
    )
  }

  // ── Режим перегляду ──────────────────────────────────────────────────────
  return (
    <div className="group flex flex-col rounded-lg border border-ink-500 bg-ink-800 px-5 py-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-parchment-dim">
          {/* НОВЕ: зображення/герб замість іконки, якщо є */}
          {faction.image_url && !imgBroken ? (
            <img
              src={faction.image_url} alt=""
              className="h-6 w-6 rounded-full border border-ink-500 object-cover"
              onError={() => setImgBroken(true)}
            />
          ) : (
            <Shield size={15} strokeWidth={1.75} />
          )}
          {faction.type && (
            <span className="rounded-full bg-ink-700 px-2 py-0.5 text-xs text-parchment-dim">
              {faction.type}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={startEditing}
            className="rounded p-1.5 text-parchment-dim hover:bg-ink-700 hover:text-amber-soft"
            aria-label="Редагувати"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => onDelete(faction.id, name)}
            className="rounded p-1.5 text-parchment-dim hover:bg-crimson-dim/30 hover:text-crimson-soft"
            aria-label="Видалити"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <h3 className="mt-3 font-display text-lg font-medium text-parchment">{name}</h3>
      <InkStroke className="mt-1" width={60} color="var(--ink-500)" />

      {description ? (
        <p className="mt-2 line-clamp-3 text-sm text-parchment-dim"><LinkedText text={description} /></p>
      ) : (
        <p className="mt-2 text-sm italic text-parchment-dim/60">Без опису</p>
      )}

      {faction.alignment && (
        <p className="mt-3 text-xs text-parchment-dim">
          Мировлядання: <span className="text-parchment">{faction.alignment}</span>
        </p>
      )}
      {faction.leader && (
        <p className="mt-1 text-xs text-parchment-dim">
          Лідер: <span className="text-parchment">{faction.leader}</span>
        </p>
      )}

      <div className="mt-3 flex items-start gap-1.5 border-t border-ink-500 pt-3 text-xs text-parchment-dim">
        <Users size={13} className="mt-0.5 shrink-0" />
        {members.length === 0 ? (
          <span className="italic text-parchment-dim/60">Немає учасників</span>
        ) : (
          <span>{members.map((m) => m.name).join(', ')}</span>
        )}
      </div>
    </div>
  )
}
