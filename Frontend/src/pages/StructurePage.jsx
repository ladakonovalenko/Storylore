import { useState, useEffect, useCallback } from 'react'
import { Plus, Layers, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProject } from '../context/ProjectContext'
import {
  getProjectStructureBlocks, createStructureBlock, updateStructureBlock,
  deleteStructureBlock, reorderStructureBlocks,
} from '../api/structure'
import StructureBlockCard from '../components/structure/StructureBlockCard'
import ConfirmDialog from '../components/common/ConfirmDialog'
import InkStroke from '../components/layout/InkStroke'

export default function StructurePage() {
  const { activeProject, activeProjectId } = useProject()

  const [blocks, setBlocks] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [deletingBlock, setDeletingBlock] = useState(null)

  // Стан перетягування
  const [dragIndex, setDragIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const load = useCallback(async () => {
    if (!activeProjectId) { setBlocks([]); return }
    setIsLoading(true); setError(null)
    try {
      const data = await getProjectStructureBlocks(activeProjectId)
      setBlocks(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [activeProjectId])

  useEffect(() => { load() }, [load])

  const handleAddBlock = async () => {
    if (!activeProjectId) { toast.error('Спочатку оберіть активний проєкт'); return }
    setIsAdding(true)
    try {
      const created = await createStructureBlock({
        project_id: activeProjectId,
        title: `Блок ${blocks.length + 1}`,
        content: '',
      })
      setBlocks((prev) => [...prev, created])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsAdding(false)
    }
  }

  const handleSaveTitle = async (block, title) => {
    try {
      const updated = await updateStructureBlock(block.id, { title })
      setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleSaveContent = async (block, content) => {
    try {
      const updated = await updateStructureBlock(block.id, { content })
      setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingBlock) return
    try {
      await deleteStructureBlock(deletingBlock.id)
      setBlocks((prev) => prev.filter((b) => b.id !== deletingBlock.id))
      setDeletingBlock(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  // ── Перетягування (HTML5 Drag-and-Drop, без зовнішніх бібліотек) ──────────
  const handleDragStart = (index) => () => setDragIndex(index)

  const handleDragOver = (index) => (e) => {
    e.preventDefault()
    if (index === dragIndex) return
    setDragOverIndex(index)
    if (dragIndex === null || dragIndex === index) return

    setBlocks((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      return next
    })
    setDragIndex(index)
  }

  const handleDragEnd = async () => {
    setDragIndex(null)
    setDragOverIndex(null)
    // Зберігаємо фінальний порядок на бекенді одним запитом
    try {
      await reorderStructureBlocks(activeProjectId, blocks.map((b) => b.id))
    } catch (err) {
      toast.error('Не вдалося зберегти новий порядок')
    }
  }

  const projectTitle = activeProject?.title || activeProject?.name || null

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-medium text-parchment">Структура</h2>
          <InkStroke className="mt-1" width={90} />
          {projectTitle && (
            <p className="mt-2 text-sm text-parchment-dim">
              Проєкт: <span className="text-parchment">{projectTitle}</span>
            </p>
          )}
        </div>
        <button
          onClick={handleAddBlock}
          disabled={!activeProjectId || isAdding}
          className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-50"
        >
          {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={16} />}
          Новий блок
        </button>
      </div>

      <p className="mt-2 text-sm text-parchment-dim/70">
        Створюйте власні розділи у будь-якій структурі — перетягуйте їх мишею, щоб змінити порядок.
      </p>

      <div className="mt-6">
        {!activeProjectId ? (
          <p className="text-sm text-parchment-dim">
            Структура прив'язана до конкретного проєкту. Оберіть або створіть проєкт.
          </p>
        ) : isLoading ? (
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
        ) : blocks.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-ink-500 px-6 py-16 text-center">
            <Layers size={28} strokeWidth={1.5} className="text-parchment-dim" />
            <h3 className="mt-4 font-display text-xl text-parchment">Поки немає жодного блоку</h3>
            <p className="mt-2 max-w-sm text-sm text-parchment-dim">
              Додайте перший блок і вибудуйте структуру так, як зручно саме вам.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {blocks.map((block, index) => (
              <StructureBlockCard
                key={block.id}
                block={block}
                isDragging={dragIndex === index}
                isDragOver={dragOverIndex === index}
                onDragStart={handleDragStart(index)}
                onDragOver={handleDragOver(index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => e.preventDefault()}
                onSaveTitle={(title) => handleSaveTitle(block, title)}
                onSaveContent={(content) => handleSaveContent(block, content)}
                onDelete={() => setDeletingBlock(block)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deletingBlock}
        onClose={() => setDeletingBlock(null)}
        onConfirm={handleDeleteConfirm}
        title="Видалити блок?"
        message={`Видалити блок «${deletingBlock?.title}»? Цю дію не можна скасувати.`}
        confirmLabel="Видалити"
        isDangerous
      />
    </div>
  )
}
