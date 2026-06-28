import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { getTemplates, getTemplateByKey } from '../../api/templates'
import { getTemplateKey, getTemplateLabel, normalizeFields } from '../../utils/templateFields'

const STATUS_OPTIONS = [
  { value: 'alive',    label: 'Живий' },
  { value: 'deceased', label: 'Загиблий' },
  { value: 'unknown',  label: 'Невідомо' },
]

const BASE_FIELDS = [
  { key: 'name',        label: "Ім'я",         type: 'text',     required: true,  placeholder: 'Арагорн, Джон Сноу…' },
  { key: 'description', label: 'Опис',          type: 'textarea', required: false, placeholder: 'Коротко про персонажа…' },
  { key: 'background',  label: 'Передісторія',  type: 'textarea', required: false, placeholder: 'Звідки він/вона…' },
  { key: 'appearance',  label: 'Зовнішність',   type: 'textarea', required: false, placeholder: 'Опис зовнішнього вигляду…' },
  { key: 'motivation',  label: 'Мотивація',     type: 'textarea', required: false, placeholder: 'Чого прагне персонаж…' },
  { key: 'notes',       label: 'Нотатки',       type: 'textarea', required: false, placeholder: 'Додаткові нотатки…' },
]

const BASE_KEYS = new Set(BASE_FIELDS.map((f) => f.key))

export default function CharacterForm({ initial = {}, projectId, onSubmit, onCancel, isSubmitting }) {
  // Шаблони (список для select)
  const [templates, setTemplates] = useState([])
  const [templatesLoading, setTemplatesLoading] = useState(true)

  // Поля обраного шаблону
  const [templateFields, setTemplateFields] = useState([])
  const [templateLoading, setTemplateLoading] = useState(false)

  // Значення форми
  const [values, setValues] = useState({
    name: '', description: '', background: '', appearance: '',
    motivation: '', notes: '', status: 'alive', tags: '', template_key: '',
    ...initial,
    tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : (initial.tags ?? ''),
  })
  const [touched, setTouched] = useState(false)

  // Завантажуємо список шаблонів один раз
  useEffect(() => {
    getTemplates()
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setTemplatesLoading(false))
  }, [])

  // При зміні template_key — підвантажуємо поля шаблону
  useEffect(() => {
    if (!values.template_key) { setTemplateFields([]); return }
    setTemplateLoading(true)
    getTemplateByKey(values.template_key)
      .then((tpl) => {
        const fields = normalizeFields(tpl).filter(
          (f) => !BASE_KEYS.has(f.key) &&
                 !['id', 'template_key', 'project_id', 'created_at', 'updated_at'].includes(f.key)
        )
        setTemplateFields(fields)
      })
      .catch(() => setTemplateFields([]))
      .finally(() => setTemplateLoading(false))
  }, [values.template_key])

  const set = (key, val) => setValues((p) => ({ ...p, [key]: val }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!values.name.trim()) return

    const tags = values.tags
      ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    const payload = { ...values, tags, project_id: projectId || values.project_id || undefined }
    // Прибираємо порожні рядки
    Object.keys(payload).forEach((k) => { if (payload[k] === '') delete payload[k] })

    onSubmit(payload)
  }

  const inputCls = (isError = false) =>
    `mt-1 w-full rounded-md border bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:outline-none ${
      isError ? 'border-crimson-soft' : 'border-ink-500 focus:border-amber-ink'
    }`

  const renderField = ({ key, label, type, required, placeholder, options }) => {
    const val = values[key] ?? ''
    const isError = touched && required && !String(val).trim()

    if (type === 'textarea') {
      return (
        <label key={key} className="block text-sm text-parchment-dim">
          {label}{required && <span className="ml-1 text-crimson-soft">*</span>}
          <textarea
            value={val} onChange={(e) => set(key, e.target.value)}
            rows={3} placeholder={placeholder}
            className={`${inputCls(isError)} resize-none`}
          />
        </label>
      )
    }
    if (type === 'select' && options?.length) {
      return (
        <label key={key} className="block text-sm text-parchment-dim">
          {label}
          <select value={val} onChange={(e) => set(key, e.target.value)} className={inputCls()}>
            <option value="">— оберіть —</option>
            {options.map((o) => (
              <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
            ))}
          </select>
        </label>
      )
    }
    return (
      <label key={key} className="block text-sm text-parchment-dim">
        {label}{required && <span className="ml-1 text-crimson-soft">*</span>}
        <input
          type={type === 'number' ? 'number' : 'text'}
          value={val} onChange={(e) => set(key, e.target.value)}
          placeholder={placeholder} className={inputCls(isError)}
        />
        {isError && <span className="text-xs text-crimson-soft">Поле обов'язкове</span>}
      </label>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">

      {/* ── Основне ── */}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-xs font-medium uppercase tracking-widest text-parchment-dim/70">
          Основне
        </legend>
        {BASE_FIELDS.map(renderField)}
      </fieldset>

      {/* ── Статус ── */}
      <label className="block text-sm text-parchment-dim">
        Статус
        <select value={values.status} onChange={(e) => set('status', e.target.value)} className={inputCls()}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>

      {/* ── Теги ── */}
      <label className="block text-sm text-parchment-dim">
        Теги (через кому)
        <input
          type="text" value={values.tags} onChange={(e) => set('tags', e.target.value)}
          placeholder="герой, маг, злодій…" className={inputCls()}
        />
      </label>

      {/* ── Шаблон ── */}
      <label className="block text-sm text-parchment-dim">
        Шаблон анкети
        {templatesLoading ? (
          <div className="mt-1 flex items-center gap-2 text-parchment-dim">
            <Loader2 size={12} className="animate-spin" /><span className="text-xs">Завантаження…</span>
          </div>
        ) : (
          <select value={values.template_key} onChange={(e) => set('template_key', e.target.value)} className={inputCls()}>
            <option value="">— без шаблону —</option>
            {templates.map((t) => {
              const key = getTemplateKey(t)
              return <option key={key} value={key}>{getTemplateLabel(t)}</option>
            })}
          </select>
        )}
      </label>

      {/* ── Поля шаблону ── */}
      {templateLoading && (
        <div className="flex items-center gap-2 text-parchment-dim">
          <Loader2 size={12} className="animate-spin" /><span className="text-xs">Завантаження полів…</span>
        </div>
      )}
      {!templateLoading && templateFields.length > 0 && (
        <fieldset className="flex flex-col gap-3 border-t border-ink-500 pt-4">
          <legend className="mb-1 text-xs font-medium uppercase tracking-widest text-parchment-dim/70">
            Поля шаблону
          </legend>
          {templateFields.map(renderField)}
        </fieldset>
      )}

      {/* ── Валідація ── */}
      {touched && !values.name.trim() && (
        <p className="text-xs text-crimson-soft">Ім'я персонажа не може бути порожнім</p>
      )}

      {/* ── Кнопки (sticky) ── */}
      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-ink-500 bg-ink-800 pb-1 pt-3">
        <button type="button" onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm text-parchment-dim hover:bg-ink-700">
          Скасувати
        </button>
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {initial.id ? 'Зберегти зміни' : 'Створити'}
        </button>
      </div>
    </form>
  )
}
