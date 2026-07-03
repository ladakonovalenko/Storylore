import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function Modal({ title, isOpen, onClose, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // ВИПРАВЛЕНО: рендеримо через createPortal напряму в document.body.
  // Причина: якщо модалка викликається з компонента, вкладеного всередину
  // елемента з CSS transform (наприклад, Sidebar.jsx під час анімації
  // висувного мобільного меню — translate-x-0/-translate-x-full), то
  // position: fixed усередині такого елемента починає позиціонуватись
  // відносно ЦЬОГО елемента, а не всього екрана — модалка "застрягає"
  // у вузькому просторі сайдбару замість того, щоб покрити весь viewport.
  // Portal повністю обходить цю проблему незалежно від того, де в дереві
  // компонентів модалку викликано.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`modal-panel w-full ${maxWidth} rounded-lg border border-ink-500 bg-ink-800 shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-ink-500 px-5 py-4">
          <h3 className="font-display text-lg font-medium text-parchment">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Закрити"
            className="rounded p-1 text-parchment-dim hover:bg-ink-700 hover:text-parchment"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body
  )
}
