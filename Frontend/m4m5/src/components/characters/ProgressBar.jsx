import { progressBarColor, progressTextColor } from '../../utils/progressHelpers'

/**
 * Props:
 *   percent  {number}   0–100
 *   compact  {boolean}  true = тонка лінія без підпису (для карток)
 */
export default function ProgressBar({ percent, compact = false }) {
  const barCls = progressBarColor(percent)
  const textCls = progressTextColor(percent)

  if (compact) {
    return (
      <div className="mt-2">
        <div className="h-1 w-full overflow-hidden rounded-full bg-ink-500">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barCls}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className={`mt-0.5 text-xs ${textCls}`}>{percent}%</p>
      </div>
    )
  }

  const label =
    percent >= 80
      ? 'Анкету заповнено добре'
      : percent >= 50
      ? 'Анкету заповнено частково'
      : 'Анкету майже не заповнено'

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-parchment-dim">Заповненість анкети</span>
        <span className={`text-xs font-semibold ${textCls}`}>{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ink-500">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barCls}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className={`mt-1 text-xs ${textCls}`}>{label}</p>
    </div>
  )
}
