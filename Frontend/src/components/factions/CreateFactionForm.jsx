import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { getProjectFactionTemplates } from '../../api/factionTemplates'

export default function CreateFactionForm({ characters = [], projectId, initial, onSubmit, onCancel, isSubmitting }) {
  const [name, setName]               = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [type, setType]               = useState(initial?.type ?? '')
  const [alignment, setAlignment]     = useState(initial?.alignment ?? '')
  const [leader, setLeader]           = useState(initial?.leader ?? '')
  const [imageUrl, setImageUrl]       = useState(initial?.image_url ?? '')
  const [characterIds, setCharacterIds] = useState([])
  const [touched, setTouched]         = useState(false)

  // НОВЕ: власний шаблон фракції
  const [templates, setTemplates] = useState([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [templateId, setTemplateId] = useState(initial?.template_id ?? '')
  const [customValues, setCustomValues] = useState({}) // { field_id: value }

  useEffect(() => {
    if (!projectId) { setTemplatesLoading(false); return }
    getProjectFactionTemplates(projectId)
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setTemplatesLoading(false))
  }, [projectId])

  // Якщо редагування й уже маємо initial.custom_values (масив {field_id, value}) — підставляємо
  useEffect(() => {
    if (initial?.custom_values) {
      const map = {}
      initial.custom_values.forEach((v) => { map[v.field_id] = v.value ?? '' })
      setCustomValues(map)
    }
  }, [initial])

  const isNameEmpty = name.trim() === ''
  const selectedTemplate = templates.find((t) => String(t.id) === String(templateId))
  const templateFields = selectedTemplate?.fields ?? []

  const toggleCharacter = (id) => {
    setCharacterIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const setCustomValue = (fieldId, value) => {
    setCustomValues((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (isNameEmpty) return

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      type: type.trim() || undefined,
      alignment: alignment.trim() || undefined,
      leader: leader.trim() || undefined,
      image_url: imageUrl.trim() || undefined,
      template_id: templateId ? Number(templateId) : undefined,
      character_ids: characterIds,
      // НОВЕ: значення власних полів шаблону — FactionsPage відокремить це
      // поле й викличе setFactionCustomValues() окремим запитом після створення
      custom_values: templateFields.map((f) => ({
        field_id: f.id,
        value: customValues[f.id] ?? '',
      })),
    }
    onSubmit(payload)
  }

  const inputCls = (hasError = false) =>
    `mt-1 w-full rounded-md border bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:outline-none ${
      hasError ? 'border-crimson-soft' : 'border-ink-500 focus:border-amber-ink'
    }`

  return (
    <form onSubmit={handleSubmit} className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto pr-1">
      {/* Назва */}
      <label className="block text-sm text-parchment-dim">
        Назва фракції <span className="text-crimson-soft">*</span>
        <input
          autoFocus value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Орден Срібного Дракона…"
          className={inputCls(touched && isNameEmpty)}
        />
        {touched && isNameEmpty && (
          <span className="mt-1 text-xs text-crimson-soft">Назва обов'язкова</span>
        )}
      </label>

      {/* Зображення/герб фракції */}
      <div className="flex flex-col gap-1">
        <label className="block text-sm text-parchment-dim">
          Посилання на зображення / герб (необов'язково)
          <input
            value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://i.pinimg.com/…"
            className={inputCls()}
          />
        </label>
        {imageUrl && (
          <img
            src={imageUrl} alt=""
            className="mt-1 h-24 w-24 rounded-md border border-ink-500 object-cover"
            onError={(e) => { e.target.style.display = 'none' }}
            onLoad={(e) => { e.target.style.display = 'block' }}
          />
        )}
      </div>

      {/* Опис */}
      <label className="block text-sm text-parchment-dim">
        Опис
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)}
          rows={3} placeholder="Про що ця фракція, яка її мета…"
          className={`${inputCls()} resize-none`}
        />
      </label>

      {/* Тип */}
      <label className="block text-sm text-parchment-dim">
        Тип (необов'язково)
        <input
          value={type} onChange={(e) => setType(e.target.value)}
          placeholder="гільдія, культ, армія…"
          className={inputCls()}
        />
      </label>

      {/* Мировладання */}
      <label className="block text-sm text-parchment-dim">
        Мировладання (необов'язково)
        <input
          value={alignment} onChange={(e) => setAlignment(e.target.value)}
          placeholder="законно-добра, хаотично-зла…"
          className={inputCls()}
        />
      </label>

      {/* Керівництво */}
      <label className="block text-sm text-parchment-dim">
        Керівництво (необов'язково)
        <textarea
          value={leader} onChange={(e) => setLeader(e.target.value)}
          rows={2}
          placeholder="Ім'я лідера, або опишіть форму влади: рада старійшин (7-12 осіб), тріумвірат тощо…"
          className={`${inputCls()} resize-none`}
        />
      </label>

      {/* НОВЕ: власний шаблон фракції */}
      <div className="flex flex-col gap-1">
        <label className="block text-sm text-parchment-dim">
          Власний шаблон (необов'язково)
          {templatesLoading ? (
            <div className="mt-1 flex items-center gap-2 text-parchment-dim">
              <Loader2 size={12} className="animate-spin" />
              <span className="text-xs">Завантаження…</span>
            </div>
          ) : (
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={inputCls()}>
              <option value="">— без шаблону —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.template_name}</option>
              ))}
            </select>
          )}
        </label>
        {templates.length === 0 && !templatesLoading && (
          <span className="text-xs text-parchment-dim/60">
            Ще немає власних шаблонів фракцій — створіть їх у розділі «Шаблони».
          </span>
        )}
      </div>

      {/* НОВЕ: динамічні поля обраного шаблону */}
      {templateFields.length > 0 && (
        <fieldset className="flex flex-col gap-4 rounded-md border border-ink-500 p-3">
          <legend className="px-1 text-xs font-medium uppercase tracking-widest text-parchment-dim/70">
            Поля шаблону «{selectedTemplate.template_name}»
          </legend>
          {templateFields.map((f) => (
            <label key={f.id} className="block text-sm text-parchment-dim">
              {f.label}
              {f.field_type === 'textarea' ? (
                <textarea
                  value={customValues[f.id] ?? ''}
                  onChange={(e) => setCustomValue(f.id, e.target.value)}
                  rows={3} placeholder={f.placeholder ?? ''}
                  className={`${inputCls()} resize-none`}
                />
              ) : (
                <input
                  value={customValues[f.id] ?? ''}
                  onChange={(e) => setCustomValue(f.id, e.target.value)}
                  placeholder={f.placeholder ?? ''}
                  className={inputCls()}
                />
              )}
            </label>
          ))}
        </fieldset>
      )}

      {/* Персонажі-учасники */}
      <div className="block text-sm text-parchment-dim">
        Персонажі фракції (необов'язково)
        {characters.length === 0 ? (
          <p className="mt-1 text-xs italic text-parchment-dim/60">
            У цьому проєкті ще немає персонажів
          </p>
        ) : (
          <div className="mt-1 max-h-44 overflow-y-auto rounded-md border border-ink-500 bg-ink-900 p-2">
            {characters.map((c) => {
              const alreadyInOtherFaction = c.faction_id != null
              return (
                <label
                  key={c.id}
                  className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-parchment hover:bg-ink-700"
                >
                  <input
                    type="checkbox"
                    checked={characterIds.includes(c.id)}
                    onChange={() => toggleCharacter(c.id)}
                    className="accent-amber-ink"
                  />
                  <span className="flex-1">{c.name}</span>
                  {alreadyInOtherFaction && (
                    <span className="text-xs text-parchment-dim/60">вже у фракції</span>
                  )}
                </label>
              )
            })}
          </div>
        )}
        <p className="mt-1 text-xs text-parchment-dim/60">
          Персонаж може належати лише одній фракції — вибір тут перепризначить його сюди.
        </p>
      </div>

      {/* Кнопки */}
      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-ink-500 bg-ink-800 pb-1 pt-3">
        <button type="button" onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm text-parchment-dim hover:bg-ink-700">
          Скасувати
        </button>
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {initial ? 'Зберегти зміни' : 'Створити фракцію'}
        </button>
      </div>
    </form>
  )
}
