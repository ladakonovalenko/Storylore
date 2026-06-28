import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import Modal from '../common/Modal'
import { getTemplateByKey } from '../../api/templates'
import { getTemplateKey, getTemplateLabel, normalizeFields } from '../../utils/templateFields'

export default function TemplateDetailModal({ template, isOpen, onClose }) {
  const [detail, setDetail] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen || !template) return

    let isCancelled = false
    setIsLoading(true)
    setError(null)
    setDetail(null)

    getTemplateByKey(getTemplateKey(template))
      .then((data) => {
        if (!isCancelled) setDetail(data)
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
  }, [isOpen, template])

  if (!template) return null

  const fields = detail ? normalizeFields(detail) : []

  return (
    <Modal
      title={getTemplateLabel(template)}
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-parchment-dim">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Завантаження полів шаблону…</span>
        </div>
      ) : error ? (
        <p className="py-4 text-sm text-crimson-soft">{error}</p>
      ) : fields.length === 0 ? (
        <p className="py-4 text-sm text-parchment-dim">
          У цього шаблону немає визначених полів.
        </p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-500 text-left text-xs uppercase tracking-wide text-parchment-dim">
                <th className="py-2 pr-3 font-medium">Поле</th>
                <th className="py-2 pr-3 font-medium">Тип</th>
                <th className="py-2 font-medium">Обов&rsquo;язкове</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field.key} className="border-b border-ink-500/50">
                  <td className="py-2 pr-3 text-parchment">{field.label}</td>
                  <td className="py-2 pr-3">
                    <span className="rounded-full bg-ink-700 px-2 py-0.5 font-mono text-xs text-parchment-dim">
                      {field.type}
                    </span>
                  </td>
                  <td className="py-2">
                    {field.required ? (
                      <span className="text-amber-soft">так</span>
                    ) : (
                      <span className="text-parchment-dim/60">ні</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}
