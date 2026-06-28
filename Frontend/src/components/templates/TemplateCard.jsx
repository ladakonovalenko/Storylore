import { FileText, ChevronRight } from 'lucide-react'
import { getTemplateLabel } from '../../utils/templateFields'
import InkStroke from '../layout/InkStroke'

export default function TemplateCard({ template, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="group flex flex-col items-start rounded-lg border border-ink-500 bg-ink-800 px-5 py-4 text-left transition-colors hover:border-amber-ink"
    >
      <div className="flex w-full items-start justify-between">
        <FileText size={16} className="text-parchment-dim" strokeWidth={1.75} />
        <ChevronRight
          size={16}
          className="text-parchment-dim transition-transform group-hover:translate-x-0.5 group-hover:text-amber-soft"
        />
      </div>
      <h3 className="mt-3 font-display text-lg font-medium text-parchment">
        {getTemplateLabel(template)}
      </h3>
      <InkStroke className="mt-1" width={60} color="var(--ink-500)" />
      {template.description && (
        <p className="mt-2 line-clamp-2 text-sm text-parchment-dim">{template.description}</p>
      )}
    </button>
  )
}
