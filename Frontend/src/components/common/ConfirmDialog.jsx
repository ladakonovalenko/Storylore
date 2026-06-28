import Modal from './Modal'

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Підтвердіть дію',
  message,
  confirmLabel = 'Підтвердити',
  isDangerous = true,
}) {
  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
      <p className="text-sm text-parchment-dim">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-md px-4 py-2 text-sm text-parchment-dim hover:bg-ink-700"
        >
          Скасувати
        </button>
        <button
          onClick={() => {
            onConfirm()
            onClose()
          }}
          className={`rounded-md px-4 py-2 text-sm font-medium text-ink-900 ${
            isDangerous ? 'bg-crimson-soft hover:bg-crimson-dim' : 'bg-amber-soft hover:bg-amber-ink'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
