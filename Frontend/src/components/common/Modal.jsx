import { useEffect } from 'react'
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* НОВЕ: клас modal-panel — виключає це вікно з глобального hover-підняття
          карток (index.css), яке інакше випадково зачіпало б і модалку через
          той самий набір класів rounded-lg + border-ink-500 */}
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
    </div>
  )
}
