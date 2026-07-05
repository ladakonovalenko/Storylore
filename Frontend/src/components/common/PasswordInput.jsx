import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

// Переюзабельне поле пароля з кнопкою-оком — показує/ховає введені символи.
// Приймає ті самі пропси, що й звичайний <input>, плюс className для стилізації.
export default function PasswordInput({ className, ...inputProps }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        {...inputProps}
        type={visible ? 'text' : 'password'}
        className={`${className ?? ''} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-parchment-dim hover:text-parchment"
        aria-label={visible ? 'Приховати пароль' : 'Показати пароль'}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}
