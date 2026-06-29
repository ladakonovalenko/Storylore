import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import LinkedEntitiesPicker from './LinkedEntitiesPicker'

export const WIKI_CATEGORIES = [
  'Магічна система',
  'Зброя та технології',
  'Релігія та обряди',
  'Флора і фауна',
  'Раси та народи',
  'Космогонія',
  'Культура та традиції',
  'Історія та політика',
  'Термінологія',
  'Канва сюжету',
  'Інше',
]

// НОВЕ: шаблон-заготовка, що підставляється при виборі категорії "Канва сюжету"
const PLOT_OUTLINE_TEMPLATE = `Вступ:


Розкачка:


Основний конфлікт:


Варіанти вирішення:


Фінал:
`

const inputCls =
  'mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none'

export default function WikiArticleForm({
  initial, characters = [], factions = [], locations = [],
  onSubmit, onCancel, isSubmitting,
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [category, setCategory] = useState(initial?.category ?? 'Інше')
  const [content, setContent] = useState(initial?.content ?? '')
  const [links, setLinks] = useState(
    (initial?.links ?? []).map((l) => ({ entity_type: l.entity_type, entity_id: l.entity_id }))
  )
  const [touched, setTouched] = useState(false)

  // НОВЕ: при виборі "Канва сюжету" на порожньому тексті — підставляємо шаблон-заготовку
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory)
    if (newCategory === 'Канва сюжету' && content.trim() === '') {
      setContent(PLOT_OUTLINE_TEMPLATE)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      category,
      content: content.trim(),
      links,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
      <label className="block text-sm text-parchment-dim">
        Назва <span className="text-crimson-soft">*</span>
        <input
          autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Магія вогню, Орденський клинок, Свято врожаю…"
          className={inputCls}
        />
        {touched && !title.trim() && (
          <span className="mt-1 block text-xs text-crimson-soft">Назва обов'язкова</span>
        )}
      </label>

      <label className="block text-sm text-parchment-dim">
        Категорія
        <select value={category} onChange={(e) => handleCategoryChange(e.target.value)} className={inputCls}>
          {WIKI_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>

      <label className="block text-sm text-parchment-dim">
        Текст статті
        <textarea
          value={content} onChange={(e) => setContent(e.target.value)}
          rows={10} placeholder="Опишіть цю частину вашого світу детально…"
          className={`${inputCls} resize-none`}
        />
      </label>

      <div className="block text-sm text-parchment-dim">
        Пов'язані сутності (необов'язково)
        <div className="mt-1">
          <LinkedEntitiesPicker
            characters={characters} factions={factions} locations={locations}
            value={links} onChange={setLinks}
          />
        </div>
      </div>

      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-ink-500 bg-ink-800 pb-1 pt-3">
        <button type="button" onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm text-parchment-dim hover:bg-ink-700">
          Скасувати
        </button>
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {initial ? 'Зберегти зміни' : 'Створити статтю'}
        </button>
      </div>
    </form>
  )
}
