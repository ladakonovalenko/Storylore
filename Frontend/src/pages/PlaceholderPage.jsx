import InkStroke from '../components/layout/InkStroke'

export default function PlaceholderPage({ title, moduleNumber, description }) {
  return (
    <div className="flex h-full flex-col items-start justify-center">
      <span className="font-mono text-xs uppercase tracking-wider text-parchment-dim">
        Модуль {moduleNumber}
      </span>
      <h2 className="mt-2 font-display text-3xl font-medium text-parchment">{title}</h2>
      <InkStroke className="mt-2" width={140} color="var(--ink-500)" />
      <p className="mt-4 max-w-md text-sm text-parchment-dim">{description}</p>
    </div>
  )
}
