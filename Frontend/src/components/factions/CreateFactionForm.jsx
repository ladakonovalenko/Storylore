import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function CreateFactionForm({ characters = [], onSubmit, onCancel, isSubmitting }) {
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [type, setType]               = useState('')
  const [alignment, setAlignment]     = useState('')
  const [leader, setLeader]           = useState('')
  const [imageUrl, setImageUrl]       = useState('') // НОВЕ
  const [characterIds, setCharacterIds] = useState([])
  const [touched, setTouched]         = useState(false)

  const isNameEmpty = name.trim() === ''

  const toggleCharacter = (id) => {
    setCharacterIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
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
      image_url: imageUrl.trim() || undefined, // НОВЕ
      character_ids: characterIds,
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

      {/* НОВЕ: зображення/герб фракції */}
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

      {/* Лідер */}
      <label className="block text-sm text-parchment-dim">
        Лідер (необов'язково)
        <input
          value={leader} onChange={(e) => setLeader(e.target.value)}
          placeholder="Ім'я лідера…"
          className={inputCls()}
        />
      </label>

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
