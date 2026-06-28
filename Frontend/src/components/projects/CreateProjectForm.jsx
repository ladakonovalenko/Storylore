import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function CreateProjectForm({ onSubmit, onCancel, isSubmitting }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [touched, setTouched] = useState(false)

  const isTitleEmpty = title.trim() === ''

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (isTitleEmpty) return
    onSubmit({ title: title.trim(), description: description.trim() || undefined })
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="block text-sm text-parchment-dim">
        Назва проєкту
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Хроніки Аметистового Архіпелагу"
          className={`mt-1 w-full rounded-md border bg-ink-900 px-3 py-2 text-parchment placeholder:text-parchment-dim/50 focus:outline-none ${
            touched && isTitleEmpty ? 'border-crimson-soft' : 'border-ink-500 focus:border-amber-ink'
          }`}
        />
      </label>
      {touched && isTitleEmpty && (
        <p className="mt-1 text-xs text-crimson-soft">Назва не може бути порожньою</p>
      )}

      <label className="mt-4 block text-sm text-parchment-dim">
        Опис (необов&rsquo;язково)
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Про що ця книга чи світ?"
          className="mt-1 w-full resize-none rounded-md border border-ink-500 bg-ink-900 px-3 py-2 text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none"
        />
      </label>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm text-parchment-dim hover:bg-ink-700"
        >
          Скасувати
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          Створити проєкт
        </button>
      </div>
    </form>
  )
}
