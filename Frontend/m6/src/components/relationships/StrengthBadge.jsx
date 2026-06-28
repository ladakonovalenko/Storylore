/**
 * Відображає числове значення strength із кольором та іконкою.
 *   > 0  → зелений (союзний)
 *   < 0  → червоний (ворожий)
 *   = 0  → сірий   (нейтральний)
 */
export default function StrengthBadge({ strength }) {
  const n = Number(strength ?? 0)

  const cls =
    n > 0 ? 'bg-moss-dim/20 text-moss-soft' :
    n < 0 ? 'bg-crimson-dim/20 text-crimson-soft' :
             'bg-ink-700 text-parchment-dim'

  const label = n > 0 ? `+${n}` : String(n)

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${cls}`}>
      {label}
    </span>
  )
}
