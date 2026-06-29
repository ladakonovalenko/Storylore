import { useState, useEffect, useCallback } from 'react'
import { Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProject } from '../context/ProjectContext'
import { getPlotOutline, updatePlotOutline } from '../api/plotOutline'
import InkStroke from '../components/layout/InkStroke'

// Секції каркасу — порядок, заголовок, підказка з контексту відгуку тестувальниці
const SECTIONS = [
  { key: 'logline',           label: 'Про що історія',      hint: '1-2 речення — найкоротша суть' },
  { key: 'setup',             label: 'Зав\u2019язка',             hint: 'Що запускає історію' },
  { key: 'rising_action',     label: 'Розкачка',             hint: 'Як нарощується напруга' },
  { key: 'main_conflict',     label: 'Основний конфлікт',    hint: 'Головне протистояння історії' },
  { key: 'key_turns',         label: 'Ключові повороти',     hint: 'Найважливіші зміни напрямку сюжету' },
  { key: 'resolution_options',label: 'Варіанти вирішення',   hint: 'Якщо ще не визначились, або це може змінитись по ходу сюжету' },
  { key: 'ending',            label: 'Фінал',                hint: 'Як усе завершується' },
]

const inputCls =
  'mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none resize-none'

export default function PlotOutlinePage() {
  const { activeProject, activeProjectId } = useProject()

  const [values, setValues] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!activeProjectId) { setValues({}); return }
    setIsLoading(true); setError(null)
    try {
      const data = await getPlotOutline(activeProjectId)
      setValues(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [activeProjectId])

  useEffect(() => { load() }, [load])

  const setField = (key, val) => setValues((p) => ({ ...p, [key]: val }))

  const handleSave = async () => {
    if (!activeProjectId) return
    setIsSaving(true)
    try {
      const payload = Object.fromEntries(SECTIONS.map((s) => [s.key, values[s.key] ?? '']))
      const updated = await updatePlotOutline(activeProjectId, payload)
      setValues(updated)
      toast.success('Каркас сюжету збережено')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const projectTitle = activeProject?.title || activeProject?.name || null

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="font-display text-3xl font-medium text-parchment">Каркас сюжету</h2>
      <InkStroke className="mt-1" width={90} />
      {projectTitle && (
        <p className="mt-2 text-sm text-parchment-dim">
          Проєкт: <span className="text-parchment">{projectTitle}</span>
        </p>
      )}
      <p className="mt-2 text-sm text-parchment-dim/70">
        Не план по главах, а максимально коротка схема всієї історії.
      </p>

      {!activeProjectId ? (
        <p className="mt-8 text-sm text-parchment-dim">
          Каркас сюжету прив'язаний до конкретного проєкту. Оберіть або створіть проєкт.
        </p>
      ) : isLoading ? (
        <div className="mt-8 flex items-center gap-2 text-parchment-dim">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Завантаження…</span>
        </div>
      ) : error ? (
        <div className="mt-8 rounded-lg border border-crimson-dim bg-crimson-dim/10 px-5 py-4">
          <p className="text-sm text-crimson-soft">{error}</p>
          <button onClick={load} className="mt-2 text-xs text-crimson-soft underline hover:no-underline">
            Спробувати знову
          </button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-5">
          {SECTIONS.map(({ key, label, hint }) => (
            <label key={key} className="block text-sm text-parchment-dim">
              {label}
              <textarea
                value={values[key] ?? ''}
                onChange={(e) => setField(key, e.target.value)}
                rows={key === 'logline' ? 2 : 4}
                placeholder={hint}
                className={inputCls}
              />
              <span className="mt-1 block text-xs text-parchment-dim/50">{hint}</span>
            </label>
          ))}

          <div className="sticky bottom-0 flex justify-end border-t border-ink-500 bg-ink-900 pb-1 pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-md bg-amber-ink px-5 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Зберегти
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
