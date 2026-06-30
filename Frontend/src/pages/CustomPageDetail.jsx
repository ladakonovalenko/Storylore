import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Loader2, Layers, Edit3, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getCustomPageBlocks, createCustomPageBlock, updateCustomPageBlock,
  deleteCustomPageBlock, reorderCustomPageBlocks, updateCustomPage,
} from '../api/customPages'
import { getProjectCustomPages } from '../api/customPages'
import { useProject } from '../context/ProjectContext'
import StructureBlockCard from '../components/structure/StructureBlockCard'
import ConfirmDialog from '../components/common/ConfirmDialog'
import InkStroke from '../components/layout/InkStroke'

export default function CustomPageDetail() {
  const { pageId } = useParams()
  const { activeProjectId } = useProject()

  const [page, setPage] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [deletingBlock, setDeletingBlock] = useState(null)

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const [dragIndex, setDragIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true); setError(null)
    try {
      // Знаходимо саму сторінку серед сторінок активного проєкту (щоб мати назву)
      const pages = activeProjectId ? await getProjectCustomPages(activeProjectId) : []
      const found = pages.find((p) => String(p.id) === pageId)
      setPage(found ?? null)

      const data = await getCustomPageBlocks(pageId)
      setBlocks(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [pageId, activeProjectId])

  useEffect(() => { load() }, [load])

  const handleAddBlock = async () => {
    setIsAdding(true)
    try {
      const created = await createCustomPageBlock({
        page_id: Number(pageId),
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
      const updated = await updateCustomPageBlock(block.id, { title })
      setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleSaveContent = async (block, content) => {
    try {
      const updated = await updateCustomPageBlock(block.id, { content })
      setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingBlock) return
    try {
      await deleteCustomPageBlock(deletingBlock.id)
      setBlocks((prev) => prev.filter((b) => b.id !== deletingBlock.id))
      setDeletingBlock(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  // ── Перейменування самої сторінки ──
  const commitPageTitle = async () => {
    if (!titleDraft.trim() || !page) { setEditingTitle(false); return }
    try {
      const updated = await updateCustomPage(page.id, { title: titleDraft.trim() })
      setPage(updated)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setEditingTitle(false)
    }
  }

  // ── Перетягування блоків (той самий підхід, що в StructurePage) ──
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
    try {
      await reorderCustomPageBlocks(pageId, blocks.map((b) => b.id))
    } catch (err) {
      toast.error('Не вдалося зберегти новий порядок')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitPageTitle(); if (e.key === 'Escape') setEditingTitle(false) }}
                className="font-display text-2xl font-medium text-parchment bg-ink-900 border border-amber-ink rounded-md px-2 py-1 focus:outline-none"
              />
              <button onClick={commitPageTitle} className="rounded p-1.5 text-amber-soft hover:bg-ink-700"><Check size={16} /></button>
            </div>
          ) : (
            <h2
              onClick={() => { setTitleDraft(page?.title ?? ''); setEditingTitle(true) }}
              className="flex items-center gap-2 cursor-pointer font-display text-3xl font-medium text-parchment hover:text-amber-soft"
            >
              {page?.title ?? 'Сторінка'} <Edit3 size={15} className="text-parchment-dim/50" />
            </h2>
          )}
          <InkStroke className="mt-1" width={90} />
        </div>
        <button
          onClick={handleAddBlock}
          disabled={isAdding}
          className="flex shrink-0 items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-50"
        >
          {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={16} />}
          Новий блок
        </button>
      </div>

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
        ) : blocks.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-ink-500 px-6 py-16 text-center">
            <Layers size={28} strokeWidth={1.5} className="text-parchment-dim" />
            <h3 className="mt-4 font-display text-xl text-parchment">Поки немає жодного блоку</h3>
            <p className="mt-2 max-w-sm text-sm text-parchment-dim">
              Додайте перший блок і наповніть цю сторінку власним змістом.
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
