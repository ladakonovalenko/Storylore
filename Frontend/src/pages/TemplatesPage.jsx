import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { getTemplates } from '../api/templates'
import { getTemplateKey } from '../utils/templateFields'
import TemplateCard from '../components/templates/TemplateCard'
import TemplateDetailModal from '../components/templates/TemplateDetailModal'
import InkStroke from '../components/layout/InkStroke'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openTemplate, setOpenTemplate] = useState(null)

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

      <div className="mt-8">
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

      <TemplateDetailModal
        template={openTemplate}
        isOpen={openTemplate !== null}
        onClose={() => setOpenTemplate(null)}
      />
    </div>
  )
}
