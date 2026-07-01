import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Shield, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getProjectFactions, createFaction, updateFaction, deleteFaction, setFactionCharacters } from '../api/factions'
import { getCharacters } from '../api/characters'
import { useProject } from '../context/ProjectContext'
import FactionCard from '../components/factions/FactionCard'
import CreateFactionForm from '../components/factions/CreateFactionForm'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import InkStroke from '../components/layout/InkStroke'


export default function FactionsPage() {
  const { activeProject, activeProjectId } = useProject()
  // НОВЕ: підтримка глобального пошуку — підсвітка картки через ?focus=<id>
  const [searchParams, setSearchParams] = useSearchParams()
  const [highlightedId, setHighlightedId] = useState(null)

  const [factions, setFactions]         = useState([])
  // НОВЕ: персонажі проєкту — потрібні для мультивибору учасників фракції
  const [characters, setCharacters]     = useState([])
  const [isLoading, setIsLoading]       = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError]               = useState(null)
  const [isModalOpen, setIsModalOpen]   = useState(false)

  // ── Стан для підтвердження видалення ──────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, name: '' })

  const load = useCallback(async () => {
    if (!activeProjectId) { setFactions([]); setCharacters([]); return }
    setIsLoading(true); setError(null)
    try {
      // НОВЕ: вантажимо фракції та персонажів проєкту паралельно
      const [factionsData, charactersData] = await Promise.all([
        getProjectFactions(activeProjectId),
        getCharacters(activeProjectId),
      ])
      setFactions(factionsData)
      setCharacters(charactersData)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [activeProjectId])

  useEffect(() => { load() }, [load])

  // НОВЕ: прокрутка до картки фракції та тимчасова підсвітка з глобального пошуку (?focus=<id>)
  useEffect(() => {
    const focusId = searchParams.get('focus')
    if (!focusId || factions.length === 0) return
    const target = factions.find((f) => String(f.id) === focusId)
    if (target) {
      setHighlightedId(target.id)
      setTimeout(() => {
        document.getElementById(`faction-${target.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      setTimeout(() => setHighlightedId(null), 2500)
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('focus')
      return next
    }, { replace: true })
  }, [searchParams, factions]) // eslint-disable-line react-hooks/exhaustive-deps

  // НОВЕ: лише оновити список персонажів (після зміни складу фракції),
  // без повторного завантаження самих фракцій
  const refreshCharacters = useCallback(async () => {
    if (!activeProjectId) return
    try {
      const data = await getCharacters(activeProjectId)
      setCharacters(data)
    } catch (err) {
      toast.error('Не вдалося оновити список персонажів')
    }
  }, [activeProjectId])

  // ── Створення ──────────────────────────────────────────────────────────────
  const handleCreate = async (payload) => {
    if (!activeProjectId) { toast.error('Спочатку оберіть активний проєкт'); return }
    // НОВЕ: відокремлюємо character_ids від полів самої фракції —
    // бекенд create_faction не очікує цього поля
    const { character_ids = [], ...factionPayload } = payload
    setIsSubmitting(true)
    try {
      const newFaction = await createFaction({ ...factionPayload, project_id: activeProjectId })
      // НОВЕ: якщо обрали персонажів — призначаємо їх одразу після створення фракції
      if (character_ids.length > 0) {
        await setFactionCharacters(newFaction.id, character_ids)
        await refreshCharacters()
      }
      setFactions((prev) => [newFaction, ...prev])
      toast.success(`Фракцію «${newFaction.name}» створено`)
      setIsModalOpen(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Редагування основних полів ──────────────────────────────────────────────
  const handleEdit = async (factionId, payload) => {
    try {
      const updated = await updateFaction(factionId, payload)
      setFactions((prev) => prev.map((f) => f.id === factionId ? updated : f))
      toast.success(`Фракцію «${updated.name}» оновлено`)
    } catch (err) {
      toast.error(err.message)
      throw err
    }
  }

  // НОВЕ: зміна складу персонажів фракції (виклик з FactionCard після збереження)
  const handleAssignCharacters = async (factionId, characterIds) => {
    try {
      await setFactionCharacters(factionId, characterIds)
      await refreshCharacters()
    } catch (err) {
      toast.error(err.message)
      throw err
    }
  }

  // ── Видалення: відкрити діалог ─────────────────────────────────────────────
  const handleDeleteRequest = (factionId, factionName) => {
    setConfirmDelete({ isOpen: true, id: factionId, name: factionName })
  }

  // ── Видалення: підтверджено ────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    const { id, name } = confirmDelete
    setConfirmDelete({ isOpen: false, id: null, name: '' })
    try {
      await deleteFaction(id)
      setFactions((prev) => prev.filter((f) => f.id !== id))
      // НОВЕ: персонажі, що були в цій фракції, лишаються в БД, але втрачають faction_id —
      // оновлюємо локальний список, щоб не показувати застарілу прив'язку
      await refreshCharacters()
      toast.success(`Фракцію «${name}» видалено`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const projectTitle = activeProject?.title || activeProject?.name || null

  return (
    <div>
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-medium text-parchment">Фракції</h2>
          <InkStroke className="mt-1" width={80} />
          <p className="mt-2 max-w-xl text-sm text-parchment-dim">
            Організації, ордени, гільдії та угруповання вашого світу — з власним складом,
            ідеологією та персонажами-учасниками.
          </p>
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
                <div
                  key={faction.id}
                  id={`faction-${faction.id}`}
                  className={highlightedId === faction.id ? 'rounded-lg ring-2 ring-amber-ink transition-shadow' : ''}
                >
                  <FactionCard
                    faction={faction}
                    characters={characters}
                    onEdit={handleEdit}
                    onAssignCharacters={handleAssignCharacters}
                    onDelete={handleDeleteRequest}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Модалка створення */}
      <Modal title="Нова фракція" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="max-w-lg">
        <CreateFactionForm
          characters={characters}
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Діалог підтвердження видалення */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null, name: '' })}
        onConfirm={handleDeleteConfirm}
        title="Видалити фракцію?"
        message={`Ви впевнені, що хочете видалити «${confirmDelete.name}»? Цю дію не можна скасувати.`}
        confirmLabel="Видалити"
        isDangerous
      />
    </div>
  )
}
