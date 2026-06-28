/**
 * InkStroke — фірмовий елемент дизайну StoryLore.
 * Імітує недбалий, але впевнений рукописний штрих чорнилом.
 * Використовується під активним пунктом навігації та як розділювач секцій.
 */
export default function InkStroke({ className = '', color = 'var(--amber-ink)', width = 120 }) {
  return (
    <svg
      width={width}
      height="10"
      viewBox="0 0 120 10"
      fill="none"
      className={`ink-stroke ${className}`}
      aria-hidden="true"
    >
      <path
        d="M2 6.5C14 8.5 22 2 34 4.5C46 7 56 2.5 68 4C80 5.5 90 7.5 102 4.5C108 3 112 5 118 3.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        pathLength="1"
        style={{
          strokeDasharray: 1,
          strokeDashoffset: 0,
          animation: 'ink-draw 0.6s ease-out',
        }}
      />
      <style>{`
        @keyframes ink-draw {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ink-stroke path { animation: none !important; }
        }
      `}</style>
    </svg>
  )
}
