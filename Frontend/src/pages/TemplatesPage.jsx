import { useEffect, useState, useCallback } from 'react'
import { Loader2, Settings, Sparkles } from 'lucide-react'
import { getTemplates } from '../api/templates'
import { getProjectCustomTemplates } from '../api/customTemplates'
import { getTemplateKey } from '../utils/templateFields'
import { useProject } from '../context/ProjectContext'
import TemplateCard from '../components/templates/TemplateCard'
import TemplateDetailModal from '../components/templates/TemplateDetailModal'
import CustomTemplateManager from '../components/templates/CustomTemplateManager'
import InkStroke from '../components/layout/InkStroke'

export default function TemplatesPage() {
  const { activeProjectId } = useProject()

  const [templates, setTemplates] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openTemplate, setOpenTemplate] = useState(null)

  // НОВЕ: власні шаблони проєкту
  const [customTemplates, setCustomTemplates] = useState([])
  const [isCustomLoading, setIsCustomLoading] = useState(false)
  const [isManagerOpen, setIsManagerOpen] = useState(false)

  useEffect(() => {
    let isCancelled = false
    setIsLoading(true)
    getTemplates()
      .then((data) => {
        if (!isCancelled) setTemplates(data)
      })
      .catch((err) => {
        if (!isCancelled) setError(err.message)
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })
    return () => {
      isCancelled = true
    }
  }, [])

  const loadCustomTemplates = useCallback(async () => {
    if (!activeProjectId) { setCustomTemplates([]); return }
    setIsCustomLoading(true)
    try {
      const data = await getProjectCustomTemplates(activeProjectId)
      setCustomTemplates(data)
    } catch {
      // мовчки ігноруємо — секція просто покаже порожній стан
    } finally {
      setIsCustomLoading(false)
    }
  }, [activeProjectId])

  useEffect(() => { loadCustomTemplates() }, [loadCustomTemplates])

  return (
    <div>
      <div>
        <h2 className="font-display text-3xl font-medium text-parchment">Шаблони</h2>
        <InkStroke className="mt-1" width={90} />
        <p className="mt-2 max-w-2xl text-sm text-parchment-dim">
          Шаблони визначають, які поля з&rsquo;являться в анкеті персонажа. Виберіть шаблон, щоб
          побачити повний перелік його полів.
        </p>
      </div>

      {/* НОВЕ: власні шаблони проєкту */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl font-medium text-parchment">Власні шаблони</h3>
            <p className="mt-1 text-sm text-parchment-dim">
              Створіть свою анкету з підмножини існуючих полів і власними підписами.
            </p>
          </div>
          <button
            onClick={() => {
              if (!activeProjectId) return
              setIsManagerOpen(true)
            }}
            disabled={!activeProjectId}
            className="flex shrink-0 items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-50"
          >
            <Settings size={15} /> Керувати шаблонами
          </button>
        </div>

        <div className="mt-4">
          {!activeProjectId ? (
            <p className="text-sm text-parchment-dim">
              Власні шаблони прив'язані до проєкту. Оберіть або створіть проєкт.
            </p>
          ) : isCustomLoading ? (
            <div className="flex items-center gap-2 text-parchment-dim">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Завантаження…</span>
            </div>
          ) : customTemplates.length === 0 ? (
            <div className="flex flex-col items-center rounded-lg border border-dashed border-ink-500 px-6 py-10 text-center">
              <Sparkles size={24} strokeWidth={1.5} className="text-parchment-dim" />
              <p className="mt-3 text-sm text-parchment-dim">
                Власних шаблонів ще немає для цього проєкту.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {customTemplates.map((template) => (
                <div key={template.id}
                  className="cursor-pointer rounded-lg border border-ink-500 bg-ink-800 px-5 py-4 transition-colors hover:border-ink-300"
                  onClick={() => setOpenTemplate(template)}
                >
                  <p className="font-display text-base font-medium text-parchment">{template.template_name}</p>
                  {template.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-parchment-dim">{template.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="rounded-full bg-ink-700 px-2 py-0.5 text-xs text-parchment-dim">{template.role}</span>
                    <span className="text-xs text-parchment-dim/60">
                      {(template.fields ?? []).length} {(template.fields ?? []).length === 1 ? 'поле' : 'полів'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Вбудовані шаблони */}
      <div className="mt-10">
        <h3 className="font-display text-xl font-medium text-parchment">Вбудовані шаблони</h3>
        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-parchment-dim">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Завантаження шаблонів…</span>
            </div>
          ) : error ? (
            <p className="text-sm text-crimson-soft">{error}</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-parchment-dim">Шаблонів ще не створено.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <TemplateCard
                  key={getTemplateKey(template)}
                  template={template}
                  onOpen={() => setOpenTemplate(template)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <TemplateDetailModal
        template={openTemplate}
        isOpen={openTemplate !== null}
        onClose={() => setOpenTemplate(null)}
      />

      <CustomTemplateManager
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        projectId={activeProjectId}
        templates={customTemplates}
        onChange={setCustomTemplates}
      />
    </div>
  )
}
