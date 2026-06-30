import { useState } from 'react'
import { Plus, Trash2, Edit3, Check, X, Loader2, FolderPlus, ChevronUp, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  createCustomPage, updateCustomPage, deleteCustomPage,
} from '../../api/customPages'
import {
  createNavFolder, updateNavFolder, deleteNavFolder,
  addNavItem, updateNavItem, deleteNavItem,
} from '../../api/navFolders'
import Modal from '../common/Modal'

const inputCls =
  'mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none'

// ── Рядок власної сторінки (перейменування/видалення) ──────────────────────────
function CustomPageRow({ page, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(page.title)

  const commit = async () => {
    if (!draft.trim() || draft === page.title) { setEditing(false); return }
    try {
      const updated = await updateCustomPage(page.id, { title: draft.trim() })
      onUpdated(updated)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setEditing(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteCustomPage(page.id)
      onDeleted(page.id)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-ink-500 bg-ink-800 px-3 py-2">
      {editing ? (
        <>
          <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
            className="flex-1 rounded border border-amber-ink bg-ink-900 px-2 py-1 text-sm text-parchment focus:outline-none" />
          <button onClick={commit} className="rounded p-1 text-amber-soft hover:bg-ink-700"><Check size={14} /></button>
        </>
      ) : (
        <>
          <span className="flex-1 truncate text-sm text-parchment">{page.title}</span>
          <button onClick={() => { setDraft(page.title); setEditing(true) }}
            className="rounded p-1 text-parchment-dim hover:bg-ink-700 hover:text-amber-soft"><Edit3 size={13} /></button>
          <button onClick={handleDelete}
            className="rounded p-1 text-parchment-dim hover:bg-crimson-dim/30 hover:text-crimson-soft"><Trash2 size={13} /></button>
        </>
      )}
    </div>
  )
}

// ── Рядок папки з її елементами ─────────────────────────────────────────────────
function FolderRow({ folder, availableItems, onChanged, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState(folder.name)
  const [selectedKey, setSelectedKey] = useState('')

  const commitName = async () => {
    if (!nameDraft.trim() || nameDraft === folder.name) { setEditing(false); return }
    try {
      const updated = await updateNavFolder(folder.id, { name: nameDraft.trim() })
      onChanged({ ...folder, name: updated.name })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setEditing(false)
    }
  }

  const handleDeleteFolder = async () => {
    try {
      await deleteNavFolder(folder.id)
      onDeleted(folder.id)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleAddItem = async () => {
    if (!selectedKey) return
    const [item_type, item_key] = selectedKey.split('::')
    try {
      const created = await addNavItem(folder.id, item_type, item_key)
      onChanged({ ...folder, items: [...folder.items, created] })
      setSelectedKey('')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleRemoveItem = async (item) => {
    try {
      await deleteNavItem(item.id)
      onChanged({ ...folder, items: folder.items.filter((i) => i.id !== item.id) })
    } catch (err) {
      toast.error(err.message)
    }
  }

  const moveItem = async (item, direction) => {
    const idx = folder.items.findIndex((i) => i.id === item.id)
    const swapIdx = idx + direction
    if (swapIdx < 0 || swapIdx >= folder.items.length) return
    const items = [...folder.items]
    ;[items[idx], items[swapIdx]] = [items[swapIdx], items[idx]]
    onChanged({ ...folder, items }) // оптимістично
    try {
      await Promise.all([
        updateNavItem(items[idx].id, { order_index: idx }),
        updateNavItem(items[swapIdx].id, { order_index: swapIdx }),
      ])
    } catch (err) {
      toast.error('Не вдалося зберегти порядок')
    }
  }

  const itemLabel = (item) => {
    if (item.item_type === 'built_in') {
      const found = availableItems.builtIn.find((b) => b.key === item.item_key)
      return found?.label ?? item.item_key
    }
    const found = availableItems.customPages.find((p) => String(p.id) === item.item_key)
    return found?.title ?? 'Сторінка (інший проєкт)'
  }

  // Елементи, які ще нікуди не призначені (для випадаючого списку додавання)
  const assignedKeys = new Set(folder.items.map((i) => `${i.item_type}::${i.item_key}`))
  const options = [
    ...availableItems.builtIn.map((b) => ({ value: `built_in::${b.key}`, label: b.label })),
    ...availableItems.customPages.map((p) => ({ value: `custom_page::${p.id}`, label: p.title })),
  ].filter((o) => !assignedKeys.has(o.value))

  return (
    <div className="rounded-md border border-ink-500 bg-ink-800 p-3">
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <input autoFocus value={nameDraft} onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditing(false) }}
              className="flex-1 rounded border border-amber-ink bg-ink-900 px-2 py-1 text-sm text-parchment focus:outline-none" />
            <button onClick={commitName} className="rounded p-1 text-amber-soft hover:bg-ink-700"><Check size={14} /></button>
          </>
        ) : (
          <>
            <span className="flex-1 truncate text-sm font-medium text-parchment">{folder.name}</span>
            <button onClick={() => { setNameDraft(folder.name); setEditing(true) }}
              className="rounded p-1 text-parchment-dim hover:bg-ink-700 hover:text-amber-soft"><Edit3 size={13} /></button>
            <button onClick={handleDeleteFolder}
              className="rounded p-1 text-parchment-dim hover:bg-crimson-dim/30 hover:text-crimson-soft"><Trash2 size={13} /></button>
          </>
        )}
      </div>

      {/* Елементи в папці */}
      <div className="mt-2 flex flex-col gap-1.5">
        {folder.items.length === 0 ? (
          <p className="text-xs italic text-parchment-dim/50">Папка порожня</p>
        ) : (
          folder.items.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-1.5 rounded bg-ink-900 px-2 py-1">
              <div className="flex flex-col">
                <button onClick={() => moveItem(item, -1)} disabled={idx === 0}
                  className="text-parchment-dim/50 hover:text-amber-soft disabled:opacity-20"><ChevronUp size={11} /></button>
                <button onClick={() => moveItem(item, 1)} disabled={idx === folder.items.length - 1}
                  className="text-parchment-dim/50 hover:text-amber-soft disabled:opacity-20"><ChevronDown size={11} /></button>
              </div>
              <span className="flex-1 truncate text-xs text-parchment">{itemLabel(item)}</span>
              <button onClick={() => handleRemoveItem(item)}
                className="text-parchment-dim hover:text-crimson-soft"><X size={13} /></button>
            </div>
          ))
        )}
      </div>

      {/* Додавання елемента */}
      {options.length > 0 && (
        <div className="mt-2 flex gap-2">
          <select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}
            className="flex-1 rounded border border-ink-500 bg-ink-900 px-2 py-1 text-xs text-parchment focus:border-amber-ink focus:outline-none">
            <option value="">— обрати елемент —</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={handleAddItem} disabled={!selectedKey}
            className="rounded bg-amber-ink px-2 py-1 text-xs font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-50">
            Додати
          </button>
        </div>
      )}
    </div>
  )
}

// ── Головна модалка ────────────────────────────────────────────────────────────
export default function NavSettingsModal({
  isOpen, onClose, activeProjectId,
  customPages, setCustomPages,
  folders, setFolders,
  builtInItems,
}) {
  const [newPageTitle, setNewPageTitle] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreatingPage, setIsCreatingPage] = useState(false)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

  const handleCreatePage = async (e) => {
    e.preventDefault()
    if (!newPageTitle.trim() || !activeProjectId) return
    setIsCreatingPage(true)
    try {
      const created = await createCustomPage({ project_id: activeProjectId, title: newPageTitle.trim() })
      setCustomPages((prev) => [...prev, created])
      setNewPageTitle('')
      toast.success('Сторінку створено')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsCreatingPage(false)
    }
  }

  const handleCreateFolder = async (e) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    setIsCreatingFolder(true)
    try {
      const created = await createNavFolder(newFolderName.trim())
      setFolders((prev) => [...prev, created])
      setNewFolderName('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsCreatingFolder(false)
    }
  }

  const availableItems = { builtIn: builtInItems, customPages }

  return (
    <Modal title="Налаштування навігації" isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="flex flex-col gap-6">
        {/* Власні сторінки */}
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-parchment-dim/70">
            Власні сторінки проєкту
          </h3>
          <form onSubmit={handleCreatePage} className="mb-2 flex gap-2">
            <input value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)}
              placeholder="Раси і народи, Боги пантеону…" className={`${inputCls} mt-0 flex-1`} />
            <button type="submit" disabled={isCreatingPage || !newPageTitle.trim()}
              className="flex shrink-0 items-center gap-1.5 rounded-md bg-amber-ink px-3 py-2 text-xs font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-50">
              {isCreatingPage ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Нова
            </button>
          </form>
          <div className="flex flex-col gap-1.5">
            {customPages.length === 0 ? (
              <p className="text-xs italic text-parchment-dim/50">Власних сторінок ще немає</p>
            ) : (
              customPages.map((p) => (
                <CustomPageRow
                  key={p.id} page={p}
                  onUpdated={(updated) => setCustomPages((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
                  onDeleted={(id) => setCustomPages((prev) => prev.filter((x) => x.id !== id))}
                />
              ))
            )}
          </div>
        </div>

        {/* Папки */}
        <div className="border-t border-ink-500 pt-4">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-parchment-dim/70">
            Папки меню
          </h3>
          <form onSubmit={handleCreateFolder} className="mb-2 flex gap-2">
            <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Назва папки…" className={`${inputCls} mt-0 flex-1`} />
            <button type="submit" disabled={isCreatingFolder || !newFolderName.trim()}
              className="flex shrink-0 items-center gap-1.5 rounded-md bg-amber-ink px-3 py-2 text-xs font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-50">
              {isCreatingFolder ? <Loader2 size={12} className="animate-spin" /> : <FolderPlus size={12} />}
              Нова
            </button>
          </form>
          <div className="flex flex-col gap-2">
            {folders.length === 0 ? (
              <p className="text-xs italic text-parchment-dim/50">Папок ще немає</p>
            ) : (
              folders.map((f) => (
                <FolderRow
                  key={f.id} folder={f} availableItems={availableItems}
                  onChanged={(updated) => setFolders((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
                  onDeleted={(id) => setFolders((prev) => prev.filter((x) => x.id !== id))}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
