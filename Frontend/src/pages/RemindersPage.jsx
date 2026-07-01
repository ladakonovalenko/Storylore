import { useState, useEffect, useCallback } from 'react'
import { Bell, Plus, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProject } from '../context/ProjectContext'
import { getProjectReminders, createReminder, updateReminder, deleteReminder } from '../api/reminders'
import ReminderItem from '../components/reminders/ReminderItem'
import ConfirmDialog from '../components/common/ConfirmDialog'
import InkStroke from '../components/layout/InkStroke'

export default function RemindersPage() {
  const { activeProject, activeProjectId } = useProject()

  const [reminders, setReminders] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newText, setNewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingReminder, setDeletingReminder] = useState(null)

  const load = useCallback(async () => {
    if (!activeProjectId) { setReminders([]); return }
    setIsLoading(true); setError(null)
    try {
      const data = await getProjectReminders(activeProjectId)
      setReminders(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [activeProjectId])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newText.trim() || !activeProjectId) return
    setIsSubmitting(true)
    try {
      const created = await createReminder({ project_id: activeProjectId, text: newText.trim() })
      setReminders((prev) => [created, ...prev])
      setNewText('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggle = async (reminder, isDone) => {
    try {
      const updated = await updateReminder(reminder.id, { is_done: isDone })
      setReminders((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleSaveText = async (reminder, text) => {
    try {
      const updated = await updateReminder(reminder.id, { text })
      setReminders((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingReminder) return
    try {
      await deleteReminder(deletingReminder.id)
      setReminders((prev) => prev.filter((r) => r.id !== deletingReminder.id))
      setDeletingReminder(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const active = reminders.filter((r) => !r.is_done)
  const done = reminders.filter((r) => r.is_done)
  const projectTitle = activeProject?.title || activeProject?.name || null

  const inputCls = 'w-full rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none'

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="font-display text-3xl font-medium text-parchment">Не забути</h2>
      <InkStroke className="mt-1" width={90} />
      <p className="mt-2 max-w-xl text-sm text-parchment-dim">
        Швидкі нотатки й обіцянки самій собі — те, що не хочеться забути, поки пишете історію,
        але що не заслуговує на окрему статтю чи персонажа.
      </p>
      {projectTitle && (
        <p className="mt-2 text-sm text-parchment-dim">
          Проєкт: <span className="text-parchment">{projectTitle}</span>
        </p>
      )}

      {!activeProjectId ? (
        <p className="mt-8 text-sm text-parchment-dim">
          Нагадування прив'язані до конкретного проєкту. Оберіть або створіть проєкт.
        </p>
      ) : (
        <>
          <form onSubmit={handleCreate} className="mt-6 flex gap-2">
            <input
              value={newText} onChange={(e) => setNewText(e.target.value)}
              placeholder="Обіцянка, запланована зустріч, важлива подія…"
              className={inputCls}
            />
            <button type="submit" disabled={isSubmitting || !newText.trim()}
              className="flex shrink-0 items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Додати
            </button>
          </form>

          <div className="mt-6">
            {isLoading ? (
              <div className="flex items-center gap-2 text-parchment-dim">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Завантаження…</span>
              </div>
            ) : error ? (
              <div className="rounded-lg border border-crimson-dim bg-crimson-dim/10 px-5 py-4">
                <p className="text-sm text-crimson-soft">{error}</p>
                <button onClick={load} className="mt-2 text-xs text-crimson-soft underline hover:no-underline">
                  Спробувати знову
                </button>
              </div>
            ) : reminders.length === 0 ? (
              <div className="flex flex-col items-center rounded-lg border border-dashed border-ink-500 px-6 py-12 text-center">
                <Bell size={24} strokeWidth={1.5} className="text-parchment-dim" />
                <p className="mt-3 text-sm text-parchment-dim">
                  Поки немає нічого, що варто запам'ятати.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {active.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {active.map((r) => (
                      <ReminderItem
                        key={r.id} reminder={r}
                        onToggle={(isDone) => handleToggle(r, isDone)}
                        onSave={(text) => handleSaveText(r, text)}
                        onDelete={setDeletingReminder}
                      />
                    ))}
                  </div>
                )}

                {done.length > 0 && (
                  <div className="flex flex-col gap-2 border-t border-ink-500 pt-4">
                    <span className="text-xs font-medium uppercase tracking-widest text-parchment-dim/60">
                      Виконано
                    </span>
                    {done.map((r) => (
                      <ReminderItem
                        key={r.id} reminder={r}
                        onToggle={(isDone) => handleToggle(r, isDone)}
                        onSave={(text) => handleSaveText(r, text)}
                        onDelete={setDeletingReminder}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={!!deletingReminder}
        onClose={() => setDeletingReminder(null)}
        onConfirm={handleDeleteConfirm}
        title="Видалити нагадування?"
        message="Ви впевнені, що хочете видалити цей запис? Цю дію не можна скасувати."
        confirmLabel="Видалити"
        isDangerous
      />
    </div>
  )
}
