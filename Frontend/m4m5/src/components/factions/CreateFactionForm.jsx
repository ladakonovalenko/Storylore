import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function CreateFactionForm({ onSubmit, onCancel, isSubmitting }) {
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [type, setType]               = useState('')
  const [alignment, setAlignment]     = useState('')
  const [leader, setLeader]           = useState('')
  const [touched, setTouched]         = useState(false)

  const isNameEmpty = name.trim() === ''

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
    }
    onSubmit(payload)
  }

  const inputCls = (hasError = false) =>
    `mt-1 w-full rounded-md border bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:outline-none ${
      hasError ? 'border-crimson-soft' : 'border-ink-500 focus:border-amber-ink'
    }`

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

      {/* Лідер */}
      <label className="block text-sm text-parchment-dim">
        Лідер (необов'язково)
        <input
          value={leader} onChange={(e) => setLeader(e.target.value)}
          placeholder="Ім'я лідера…"
          className={inputCls()}
        />
      </label>

      {/* Кнопки */}
      <div className="flex justify-end gap-2 border-t border-ink-500 pt-3">
        <button type="button" onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm text-parchment-dim hover:bg-ink-700">
          Скасувати
        </button>
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          Створити фракцію
        </button>
      </div>
    </form>
  )
}
