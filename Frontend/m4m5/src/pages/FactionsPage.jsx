import { useState, useEffect, useCallback } from 'react'
import { Plus, Shield, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getProjectFactions, createFaction } from '../api/factions'
import { useProject } from '../context/ProjectContext'
import FactionCard from '../components/factions/FactionCard'
import CreateFactionForm from '../components/factions/CreateFactionForm'
import Modal from '../components/common/Modal'
import InkStroke from '../components/layout/InkStroke'

export default function FactionsPage() {
  const { activeProject, activeProjectId } = useProject()

  const [factions, setFactions]         = useState([])
  const [isLoading, setIsLoading]       = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError]               = useState(null)
  const [isModalOpen, setIsModalOpen]   = useState(false)

  // ── Завантаження фракцій для активного проєкту ─────────────────────────────
  const load = useCallback(async () => {
    if (!activeProjectId) { setFactions([]); return }
    setIsLoading(true); setError(null)
    try {
      const data = await getProjectFactions(activeProjectId)
      setFactions(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [activeProjectId])

  useEffect(() => { load() }, [load])

  // ── Створення ─────────────────────────────────────────────────────────────
  const handleCreate = async (payload) => {
    if (!activeProjectId) {
      toast.error('Спочатку оберіть активний проєкт')
      return
    }
    setIsSubmitting(true)
    try {
      const newFaction = await createFaction({ ...payload, project_id: activeProjectId })
      setFactions((prev) => [newFaction, ...prev])
      toast.success(`Фракцію «${newFaction.name}» створено`)
      setIsModalOpen(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Рендер ─────────────────────────────────────────────────────────────────
  const projectTitle = activeProject?.title || activeProject?.name || null

  return (
    <div>
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-medium text-parchment">Фракції</h2>
          <InkStroke className="mt-1" width={80} />
          {projectTitle && (
            <p className="mt-2 text-sm text-parchment-dim">
              Проєкт: <span className="text-parchment">{projectTitle}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => {
            if (!activeProjectId) { toast.error('Спочатку оберіть активний проєкт'); return }
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft"
        >
          <Plus size={16} /> Нова фракція
        </button>
      </div>

      {/* Тіло */}
      <div className="mt-8">
        {/* Немає активного проєкту */}
        {!activeProjectId ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-ink-500 px-6 py-16 text-center">
            <Shield size={28} strokeWidth={1.5} className="text-parchment-dim" />
            <h3 className="mt-4 font-display text-xl text-parchment">Проєкт не обрано</h3>
            <p className="mt-2 max-w-sm text-sm text-parchment-dim">
              Фракції прив'язані до конкретного проєкту. Оберіть або створіть проєкт у шапці чи в
              розділі «Проєкти».
            </p>
          </div>

        ) : isLoading ? (
          <div className="flex items-center gap-2 text-parchment-dim">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Завантаження фракцій…</span>
          </div>

        ) : error ? (
          <div className="rounded-lg border border-crimson-dim bg-crimson-dim/10 px-5 py-4">
            <p className="text-sm text-crimson-soft">{error}</p>
            <button onClick={load} className="mt-2 text-xs text-crimson-soft underline hover:no-underline">
              Спробувати знову
            </button>
          </div>

        ) : factions.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-ink-500 px-6 py-16 text-center">
            <Shield size={28} strokeWidth={1.5} className="text-parchment-dim" />
            <h3 className="mt-4 font-display text-xl text-parchment">Фракцій ще немає</h3>
            <p className="mt-2 max-w-sm text-sm text-parchment-dim">
              Створіть першу фракцію для проєкту «{projectTitle}».
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-5 flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft"
            >
              <Plus size={16} /> Створити фракцію
            </button>
          </div>

        ) : (
          <>
            <p className="mb-4 text-xs text-parchment-dim">Усього фракцій: {factions.length}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {factions.map((faction) => (
                <FactionCard key={faction.id} faction={faction} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Модалка */}
      <Modal title="Нова фракція" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="max-w-lg">
        <CreateFactionForm
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </div>
  )
}
