import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

const EVENT_TYPES = [
  'Битва', 'Дипломатія', 'Відкриття', 'Особиста подія',
  'Катастрофа', 'Ритуал', 'Зустріч', 'Зрада', 'Смерть',
  'Народження', 'Союз', 'Конфлікт', 'Подорож', 'Таємниця',
]

const IMPORTANCE_OPTIONS = [
  { value: 'Основна',      label: '★★★ Основна' },
  { value: 'Другорядна',   label: '★★☆ Другорядна' },
  { value: 'Фонова',       label: '★☆☆ Фонова' },
]

// НОВЕ: eras/arcs/branches передаються списком з TimelinePage для вибору у формі
export default function EventForm({ initial, characters, eras = [], arcs = [], branches = [], defaultBranchId = null, projectId, onSubmit, onCancel, isSubmitting }) {
  const isEdit = !!initial

  const [title,          setTitle]          = useState(initial?.title          ?? '')
  const [description,    setDescription]    = useState(initial?.description    ?? '')
  const [eventType,      setEventType]      = useState(initial?.event_type     ?? '')
  const [customType,     setCustomType]     = useState(false)
  const [importance,     setImportance]     = useState(initial?.importance     ?? 'Другорядна')
  const [year,           setYear]           = useState(initial?.year           ?? '')
  const [dateLabel,      setDateLabel]      = useState(initial?.date_label     ?? '')
  const [isOngoing,      setIsOngoing]      = useState(initial?.is_ongoing     ?? false)
  const [location,       setLocation]       = useState(initial?.location       ?? '')
  const [tags,           setTags]           = useState(initial?.tags           ?? '')
  const [participantIds, setParticipantIds] = useState(initial?.participant_ids ?? [])
  const [eraId,          setEraId]          = useState(initial?.era_id ?? '')
  const [arcId,          setArcId]          = useState(initial?.arc_id ?? '')
  // НОВЕ: гілка — за замовчуванням підставляється активна лінія, якщо форму відкрито в режимі гілки
  const [branchId,       setBranchId]       = useState(initial?.branch_id ?? defaultBranchId ?? '')
  const [touched,        setTouched]        = useState(false)

  useEffect(() => {
    if (initial?.event_type && !EVENT_TYPES.includes(initial.event_type)) {
      setCustomType(true)
    }
  }, [])

  const toggleParticipant = (id) => {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!title.trim()) return
    onSubmit({
      project_id:      projectId,
      title:           title.trim(),
      description:     description.trim() || '',
      event_type:      eventType || 'Особиста подія',
      importance,
      year:            year !== '' ? Number(year) : null,
      date_label:      dateLabel.trim() || null,
      is_ongoing:      isOngoing,
      location:        location.trim() || null,
      tags:            tags.trim() || null,
      participant_ids: participantIds,
      // НОВЕ
      era_id:          eraId !== '' ? Number(eraId) : null,
      arc_id:          arcId !== '' ? Number(arcId) : null,
      branch_id:       branchId !== '' ? Number(branchId) : null,
    })
  }

  const inputCls = (err = false) =>
    `mt-1 w-full rounded-md border bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:outline-none ${
      err ? 'border-crimson-soft' : 'border-ink-500 focus:border-amber-ink'
    }`

  return (
    <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">

      {/* Назва */}
      <label className="block text-sm text-parchment-dim">
        Назва <span className="text-crimson-soft">*</span>
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Назва події…" className={inputCls(touched && !title.trim())} />
        {touched && !title.trim() && (
          <span className="text-xs text-crimson-soft">Назва обов'язкова</span>
        )}
      </label>

      {/* Опис */}
      <label className="block text-sm text-parchment-dim">
        Опис
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          rows={3} placeholder="Що сталось, деталі…"
          className={`${inputCls()} resize-none`} />
      </label>

      {/* Тип події */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-parchment-dim">Тип події</span>
          <div className="flex gap-1">
            <button type="button"
              onClick={() => { setCustomType(false); setEventType('') }}
              className={`rounded px-2 py-0.5 text-xs transition-colors ${
                !customType ? 'bg-amber-ink text-ink-900' : 'bg-ink-700 text-parchment-dim hover:bg-ink-500'
              }`}>
              Зі списку
            </button>
            <button type="button"
              onClick={() => setCustomType(true)}
              className={`rounded px-2 py-0.5 text-xs transition-colors ${
                customType ? 'bg-amber-ink text-ink-900' : 'bg-ink-700 text-parchment-dim hover:bg-ink-500'
              }`}>
              Свій тип
            </button>
          </div>
        </div>
        {customType ? (
          <input value={eventType} onChange={(e) => setEventType(e.target.value)}
            placeholder="Введіть тип вручну…" className={inputCls()} />
        ) : (
          <select value={eventType} onChange={(e) => setEventType(e.target.value)} className={inputCls()}>
            <option value="">— оберіть тип —</option>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      {/* Важливість */}
      <label className="block text-sm text-parchment-dim">
        Важливість
        <select value={importance} onChange={(e) => setImportance(e.target.value)} className={inputCls()}>
          {IMPORTANCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>

      {/* Час */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm text-parchment-dim">
          Рік (число)
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)}
            placeholder="100" className={inputCls()} />
        </label>
        <label className="block text-sm text-parchment-dim">
          Мітка часу
          <input value={dateLabel} onChange={(e) => setDateLabel(e.target.value)}
            placeholder="1 ера, 3 рік" className={inputCls()} />
        </label>
      </div>

      {/* НОВЕ: Ера, Арка та Гілка */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm text-parchment-dim">
          Ера (необов'язково)
          <select value={eraId} onChange={(e) => setEraId(e.target.value)} className={inputCls()}>
            <option value="">— без ери —</option>
            {eras.map((era) => <option key={era.id} value={era.id}>{era.name}</option>)}
          </select>
        </label>
        <label className="block text-sm text-parchment-dim">
          Арка (необов'язково)
          <select value={arcId} onChange={(e) => setArcId(e.target.value)} className={inputCls()}>
            <option value="">— без арки —</option>
            {arcs.map((arc) => <option key={arc.id} value={arc.id}>{arc.title}</option>)}
          </select>
        </label>
      </div>

      {/* НОВЕ: Гілка — якщо обрано, подія належить альтернативній лінії, а не основній */}
      <label className="block text-sm text-parchment-dim">
        Гілка (необов'язково)
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={inputCls()}>
          <option value="">— основна лінія —</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {branchId && (
          <span className="mt-1 block text-xs text-amber-soft/80">
            Ця подія належить альтернативній гілці, а не основній лінії часу.
          </span>
        )}
      </label>

      {/* Триваюча подія */}
      <label className="flex cursor-pointer items-center gap-2 text-sm text-parchment-dim">
        <input type="checkbox" checked={isOngoing} onChange={(e) => setIsOngoing(e.target.checked)}
          className="accent-amber-ink" />
        Подія триває досі
      </label>

      {/* Місце */}
      <label className="block text-sm text-parchment-dim">
        Місце (необов'язково)
        <input value={location} onChange={(e) => setLocation(e.target.value)}
          placeholder="Назва локації…" className={inputCls()} />
      </label>

      {/* Теги */}
      <label className="block text-sm text-parchment-dim">
        Теги (через кому)
        <input value={tags} onChange={(e) => setTags(e.target.value)}
          placeholder="битва, північ, зима…" className={inputCls()} />
      </label>

      {/* Учасники */}
      {characters?.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-parchment-dim">Учасники</span>
          <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md border border-ink-500 bg-ink-900 p-2">
            {characters.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-ink-700">
                <input type="checkbox"
                  checked={participantIds.includes(c.id)}
                  onChange={() => toggleParticipant(c.id)}
                  className="accent-amber-ink" />
                <span className="text-sm text-parchment">{c.name}</span>
                {c.role && <span className="text-xs text-parchment-dim/60">{c.role}</span>}
              </label>
            ))}
          </div>
          {participantIds.length > 0 && (
            <p className="text-xs text-parchment-dim/60">
              Обрано: {participantIds.length}
            </p>
          )}
        </div>
      )}

      {/* Кнопки */}
      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-ink-500 bg-ink-800 pb-1 pt-3">
        <button type="button" onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm text-parchment-dim hover:bg-ink-700">
          Скасувати
        </button>
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? 'Зберегти зміни' : 'Додати подію'}
        </button>
      </div>
    </form>
  )
}
