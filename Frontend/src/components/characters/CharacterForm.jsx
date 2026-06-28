import { useState, useEffect } from 'react'
import { Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { getTemplates, getTemplateByKey } from '../../api/templates'
import { getTemplateKey, getTemplateLabel, getTemplateDescription, normalizeFields, generateExampleValues, getTemplateDefaults } from '../../utils/templateFields'

const STATUS_OPTIONS = [
  { value: 'Живий',    label: 'Живий' },
  { value: 'Загиблий', label: 'Загиблий' },
  { value: 'Невідомо', label: 'Невідомо' },
]

const ROLE_OPTIONS = [
  'Протагоніст', 'Антагоніст', 'Наставник', 'Любовний інтерес',
  'Другорядний персонаж', 'Союзник', 'Суперник', 'Нейтральний',
]

// Всі поля моделі — показуємо коли немає шаблону або "показати всі"
const ALL_FIELDS = [
  { key: 'name',                     label: "Ім'я",                    type: 'text',     required: true  },
  { key: 'description',              label: 'Опис',                    type: 'textarea'  },
  { key: 'biography',                label: 'Передісторія',            type: 'textarea'  },
  { key: 'appearance',               label: 'Зовнішність',             type: 'textarea'  },
  { key: 'motivation_goals',         label: 'Мотивація та цілі',       type: 'textarea'  },
  { key: 'character_traits',         label: 'Риси характеру',          type: 'textarea'  },
  { key: 'fears_vulnerabilities',    label: 'Страхи та вразливості',   type: 'textarea'  },
  { key: 'values_beliefs',           label: 'Цінності та переконання', type: 'textarea'  },
  { key: 'self_perception',          label: 'Самосприйняття',          type: 'textarea'  },
  { key: 'traumas',                  label: 'Травми',                  type: 'textarea'  },
  { key: 'secrets',                  label: 'Таємниці',                type: 'textarea'  },
  { key: 'family_origin',            label: 'Походження',              type: 'textarea'  },
  { key: 'social_status',            label: 'Соціальний статус',       type: 'textarea'  },
  { key: 'character_arc',            label: 'Арка персонажа',          type: 'textarea'  },
  { key: 'unresolved_conflicts',     label: 'Невирішені конфлікти',    type: 'textarea'  },
  { key: 'skills',                   label: 'Навички',                 type: 'textarea'  },
  { key: 'resources',                label: 'Ресурси',                 type: 'textarea'  },
  { key: 'physical_limitations',     label: 'Фізичні обмеження',       type: 'textarea'  },
  { key: 'psychological_limitations',label: 'Психологічні обмеження',  type: 'textarea'  },
  { key: 'habits_routines',          label: 'Звички та розпорядок',    type: 'textarea'  },
  { key: 'reputation',               label: 'Репутація',               type: 'textarea'  },
  { key: 'communication_style',      label: 'Стиль спілкування',       type: 'textarea'  },
  { key: 'allies_perception',        label: 'Сприйняття союзників',    type: 'textarea'  },
  { key: 'enemies_perception',       label: 'Сприйняття ворогів',      type: 'textarea'  },
  { key: 'contrasts',                label: 'Контрасти',               type: 'textarea'  },
  { key: 'symbols',                  label: 'Символи',                 type: 'textarea'  },
]

export default function CharacterForm({ initial = {}, projectId, onSubmit, onCancel, isSubmitting }) {
  const [templates,        setTemplates]        = useState([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [templateDetail,   setTemplateDetail]   = useState(null)
  const [templateLoading,  setTemplateLoading]  = useState(false)
  const [showAllFields,    setShowAllFields]    = useState(false)
  const [customRole,       setCustomRole]       = useState(false)

  const [values, setValues] = useState({
    name: '', description: '', biography: '', appearance: '',
    motivation_goals: '', character_traits: '', fears_vulnerabilities: '',
    values_beliefs: '', self_perception: '', traumas: '', secrets: '',
    family_origin: '', social_status: '', character_arc: '',
    unresolved_conflicts: '', skills: '', resources: '',
    physical_limitations: '', psychological_limitations: '', habits_routines: '',
    reputation: '', communication_style: '', allies_perception: '',
    enemies_perception: '', contrasts: '', symbols: '',
    role: 'Протагоніст', status: 'Живий', template_key: '',
    ...initial,
    tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : (initial.tags ?? ''),
  })
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (initial.role && !ROLE_OPTIONS.includes(initial.role)) setCustomRole(true)
  }, [])

  useEffect(() => {
    getTemplates()
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setTemplatesLoading(false))
  }, [])

  useEffect(() => {
    if (!values.template_key) { setTemplateDetail(null); return }
    setTemplateLoading(true)
    getTemplateByKey(values.template_key)
      .then((tpl) => setTemplateDetail(tpl))
      .catch(() => setTemplateDetail(null))
      .finally(() => setTemplateLoading(false))
  }, [values.template_key])

  // При виборі шаблону — підставляємо дефолтні значення
  useEffect(() => {
    if (!templateDetail) return
    const defaults = getTemplateDefaults(templateDetail)
    if (Object.keys(defaults).length > 0) {
      setValues((prev) => ({ ...prev, ...defaults }))
    }
  }, [templateDetail])

  const set = (key, val) => setValues((p) => ({ ...p, [key]: val }))

  // Кнопка "Згенерувати приклад"
  const handleGenerateExample = () => {
    if (!templateDetail) return
    const examples = generateExampleValues(templateDetail)
    setValues((prev) => ({ ...prev, ...examples }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!values.name.trim()) return
    const tags = values.tags
      ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : []
    const payload = { ...values, tags, project_id: projectId || values.project_id || undefined }
    Object.keys(payload).forEach((k) => { if (payload[k] === '') delete payload[k] })
    delete payload.template_key
    onSubmit(payload)
  }

  const inputCls = (err = false) =>
    `mt-1 w-full rounded-md border bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:outline-none ${
      err ? 'border-crimson-soft' : 'border-ink-500 focus:border-amber-ink'
    }`

  // Поля для рендеру: або з шаблону, або всі
  const templateFields = templateDetail ? normalizeFields(templateDetail) : []
  const hasTemplate    = templateFields.length > 0
  const fieldsToShow   = hasTemplate && !showAllFields ? templateFields : ALL_FIELDS

  const renderField = (field) => {
    const { key, label, type, required, placeholder, hint, example } = field
    const val     = values[key] ?? ''
    const isError = touched && required && !String(val).trim()

    if (key === 'name') {
      return (
        <div key={key} className="flex flex-col gap-1">
          <label className="block text-sm text-parchment-dim">
            {label}<span className="ml-1 text-crimson-soft">*</span>
            <input type="text" value={val} onChange={(e) => set(key, e.target.value)}
              placeholder={placeholder ?? 'Арагорн, Джон Сноу…'}
              className={inputCls(isError)} />
          </label>
          {isError && <span className="text-xs text-crimson-soft">Поле обов'язкове</span>}
        </div>
      )
    }

    return (
      <div key={key} className="flex flex-col gap-1">
        <label className="block text-sm text-parchment-dim">
          {label}{required && <span className="ml-1 text-crimson-soft">*</span>}
          {type === 'textarea' ? (
            <textarea value={val} onChange={(e) => set(key, e.target.value)}
              rows={3} placeholder={placeholder ?? ''}
              className={`${inputCls(isError)} resize-none`} />
          ) : (
            <input type="text" value={val} onChange={(e) => set(key, e.target.value)}
              placeholder={placeholder ?? ''} className={inputCls(isError)} />
          )}
        </label>
        {/* Підказка */}
        {hint && (
          <p className="text-xs text-parchment-dim/60">{hint}</p>
        )}
        {/* Приклад */}
        {example && !val && (
          <button type="button"
            onClick={() => set(key, example)}
            className="self-start text-xs text-amber-soft/70 hover:text-amber-soft">
            ↙ вставити приклад
          </button>
        )}
        {isError && <span className="text-xs text-crimson-soft">Поле обов'язкове</span>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto pr-1">

      {/* ── Шаблон ── */}
      <div className="flex flex-col gap-1">
        <label className="block text-sm text-parchment-dim">
          Шаблон анкети
          {templatesLoading ? (
            <div className="mt-1 flex items-center gap-2 text-parchment-dim">
              <Loader2 size={12} className="animate-spin" />
              <span className="text-xs">Завантаження…</span>
            </div>
          ) : (
            <select value={values.template_key} onChange={(e) => set('template_key', e.target.value)}
              className={inputCls()}>
              <option value="">— повна анкета (всі поля) —</option>
              {templates.map((t) => {
                const key = getTemplateKey(t)
                return <option key={key} value={key}>{getTemplateLabel(t)}</option>
              })}
            </select>
          )}
        </label>

        {/* Опис шаблону */}
        {templateDetail && getTemplateDescription(templateDetail) && (
          <p className="rounded-md bg-ink-700 px-3 py-2 text-xs text-parchment-dim">
            {getTemplateDescription(templateDetail)}
          </p>
        )}

        {/* Кнопка "Згенерувати приклад" */}
        {templateDetail && (
          <button type="button" onClick={handleGenerateExample}
            className="flex w-fit items-center gap-1.5 rounded-md border border-amber-ink/40 px-3 py-1.5 text-xs text-amber-soft hover:bg-amber-ink/10">
            <Sparkles size={12} />
            Заповнити прикладами
          </button>
        )}
      </div>

      {/* ── Поля ── */}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-xs font-medium uppercase tracking-widest text-parchment-dim/70">
          {hasTemplate && !showAllFields ? `Поля шаблону (${templateFields.length})` : 'Всі поля'}
        </legend>

        {templateLoading ? (
          <div className="flex items-center gap-2 text-parchment-dim">
            <Loader2 size={12} className="animate-spin" />
            <span className="text-xs">Завантаження полів…</span>
          </div>
        ) : (
          fieldsToShow.map(renderField)
        )}
      </fieldset>

      {/* Перемикач "показати всі поля" */}
      {hasTemplate && (
        <button type="button"
          onClick={() => setShowAllFields((v) => !v)}
          className="flex items-center gap-1.5 self-start text-xs text-parchment-dim/60 hover:text-parchment-dim">
          {showAllFields
            ? <><ChevronUp size={12} /> Показати тільки поля шаблону</>
            : <><ChevronDown size={12} /> Показати всі поля</>
          }
        </button>
      )}

      {/* ── Роль ── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-parchment-dim">Роль</span>
          <div className="flex gap-1">
            <button type="button"
              onClick={() => { setCustomRole(false); set('role', 'Протагоніст') }}
              className={`rounded px-2 py-0.5 text-xs transition-colors ${
                !customRole ? 'bg-amber-ink text-ink-900' : 'bg-ink-700 text-parchment-dim hover:bg-ink-500'
              }`}>
              Зі списку
            </button>
            <button type="button"
              onClick={() => setCustomRole(true)}
              className={`rounded px-2 py-0.5 text-xs transition-colors ${
                customRole ? 'bg-amber-ink text-ink-900' : 'bg-ink-700 text-parchment-dim hover:bg-ink-500'
              }`}>
              Своя роль
            </button>
          </div>
        </div>
        {customRole ? (
          <input value={values.role} onChange={(e) => set('role', e.target.value)}
            placeholder="Введіть роль вручну…" className={inputCls()} />
        ) : (
          <select value={values.role} onChange={(e) => set('role', e.target.value)} className={inputCls()}>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
      </div>

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
        <input type="text" value={values.tags} onChange={(e) => set('tags', e.target.value)}
          placeholder="герой, маг, злодій…" className={inputCls()} />
      </label>

      {/* ── Валідація ── */}
      {touched && !values.name.trim() && (
        <p className="text-xs text-crimson-soft">Ім'я персонажа не може бути порожнім</p>
      )}

      {/* ── Кнопки ── */}
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
