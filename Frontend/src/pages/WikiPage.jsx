import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, BookText, Loader2, Search, X, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProject } from '../context/ProjectContext'
import {
  getProjectWikiArticles, createWikiArticle, updateWikiArticle,
  setWikiArticleLinks, deleteWikiArticle,
} from '../api/wiki'
import { getCharacters } from '../api/characters'
import { getProjectFactions } from '../api/factions'
import { getProjectLocations } from '../api/locations'
import { downloadTextFile } from '../utils/fileDownload'
import { buildLibraryMarkdown } from '../utils/wikiExport'
import WikiArticleCard from '../components/wiki/WikiArticleCard'
import WikiArticleDetail from '../components/wiki/WikiArticleDetail'
import WikiArticleForm, { WIKI_CATEGORIES } from '../components/wiki/WikiArticleForm'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import InkStroke from '../components/layout/InkStroke'

export default function WikiPage() {
  const { activeProject, activeProjectId } = useProject()
  // НОВЕ: підтримка глобального пошуку
  const [searchParams, setSearchParams] = useSearchParams()

  const [articles, setArticles] = useState([])
  const [characters, setCharacters] = useState([])
  const [factions, setFactions] = useState([])
  const [locations, setLocations] = useState([])

  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState(null)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [deletingArticle, setDeletingArticle] = useState(null)

  const load = useCallback(async () => {
    if (!activeProjectId) {
      setArticles([]); setCharacters([]); setFactions([]); setLocations([])
      return
    }
    setIsLoading(true); setError(null)
    try {
      const [arts, chars, facs, locs] = await Promise.all([
        getProjectWikiArticles(activeProjectId),
        getCharacters(activeProjectId),
        getProjectFactions(activeProjectId),
        getProjectLocations(activeProjectId),
      ])
      setArticles(arts)
      setCharacters(chars)
      setFactions(facs)
      setLocations(locs)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [activeProjectId])

  useEffect(() => { load() }, [load])

  // НОВЕ: відкриття конкретної статті з глобального пошуку (?focus=<id>)
  useEffect(() => {
    const focusId = searchParams.get('focus')
    if (!focusId || articles.length === 0) return
    const target = articles.find((a) => String(a.id) === focusId)
    if (target) setSelectedArticle(target)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('focus')
      return next
    }, { replace: true })
  }, [searchParams, articles]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleCreate = async (payload) => {
    const { links, ...articlePayload } = payload
    setIsSubmitting(true)
    try {
      const created = await createWikiArticle({
        ...articlePayload, project_id: activeProjectId, links,
      })
      setArticles((prev) => [created, ...prev])
      toast.success(`Статтю «${created.title}» створено`)
      setIsCreateOpen(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (payload) => {
    if (!editingArticle) return
    const { links, ...articlePayload } = payload
    setIsSubmitting(true)
    try {
      const updated = await updateWikiArticle(editingArticle.id, articlePayload)
      const withLinks = await setWikiArticleLinks(editingArticle.id, links)
      const merged = { ...updated, links: withLinks.links }
      setArticles((prev) => prev.map((a) => (a.id === merged.id ? merged : a)))
      setSelectedArticle((prev) => (prev?.id === merged.id ? merged : prev))
      toast.success('Збережено')
      setEditingArticle(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingArticle) return
    try {
      await deleteWikiArticle(deletingArticle.id)
      setArticles((prev) => prev.filter((a) => a.id !== deletingArticle.id))
      if (selectedArticle?.id === deletingArticle.id) setSelectedArticle(null)
      toast.success(`Статтю «${deletingArticle.title}» видалено`)
      setDeletingArticle(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  // ── Фільтрація ────────────────────────────────────────────────────────────
  const filtered = articles
    .filter((a) => !filterCategory || a.category === filterCategory)
    .filter((a) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return a.title.toLowerCase().includes(q) || (a.content || '').toLowerCase().includes(q)
    })

  const usedCategories = WIKI_CATEGORIES.filter((c) => articles.some((a) => a.category === c))
  const projectTitle = activeProject?.title || activeProject?.name || null

  // НОВЕ: завантаження всієї бібліотеки одним .md файлом
  const handleExportAll = () => {
    const md = buildLibraryMarkdown(articles, characters, factions, locations, projectTitle)
    const safeTitle = (projectTitle || 'проєкт').replace(/[\\/:*?"<>|]/g, '').trim()
    downloadTextFile(`Бібліотека-${safeTitle}.md`, md)
  }

  return (
    <div className="flex h-full gap-6">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Заголовок */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-3xl font-medium text-parchment">Бібліотека</h2>
            <InkStroke className="mt-1" width={90} />
            {projectTitle && (
              <p className="mt-2 text-sm text-parchment-dim">
                Проєкт: <span className="text-parchment">{projectTitle}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* НОВЕ: експорт усієї бібліотеки */}
            {articles.length > 0 && (
              <button
                onClick={handleExportAll}
                className="flex items-center gap-2 rounded-md border border-ink-500 px-4 py-2 text-sm text-parchment-dim hover:border-amber-ink hover:text-amber-soft"
              >
                <Download size={16} /> Завантажити все
              </button>
            )}
            <button
              onClick={() => {
                if (!activeProjectId) { toast.error('Спочатку оберіть активний проєкт'); return }
                setIsCreateOpen(true)
              }}
              className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft"
            >
              <Plus size={16} /> Нова стаття
            </button>
          </div>
        </div>

        {!activeProjectId ? (
          <EmptyState
            title="Проєкт не обрано"
            text="Статті бібліотеки прив'язані до конкретного проєкту. Оберіть або створіть проєкт."
          />
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
        ) : articles.length === 0 ? (
          <EmptyState
            title="Статей ще немає"
            text="Створіть першу статтю — про магічну систему, зброю, релігію чи будь-що інше у вашому світі."
            action={
              <button onClick={() => setIsCreateOpen(true)}
                className="mt-5 flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft">
                <Plus size={16} /> Створити статтю
              </button>
            }
          />
        ) : (
          <>
            {/* Пошук + фільтр категорій */}
            <div className="mb-4 flex flex-col gap-2">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-parchment-dim" />
                <input
                  type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Пошук за назвою або текстом…"
                  className="w-full rounded-md border border-ink-500 bg-ink-800 py-2 pl-9 pr-9 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none"
                />
                {search && (
                  <button onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-parchment-dim hover:text-parchment">
                    <X size={14} />
                  </button>
                )}
              </div>

              {usedCategories.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setFilterCategory('')}
                    className={`rounded-full px-3 py-0.5 text-xs transition-colors ${
                      !filterCategory ? 'bg-amber-ink font-medium text-ink-900' : 'bg-ink-700 text-parchment-dim hover:bg-ink-500'
                    }`}>
                    Усі
                  </button>
                  {usedCategories.map((c) => (
                    <button key={c} onClick={() => setFilterCategory(filterCategory === c ? '' : c)}
                      className={`rounded-full px-3 py-0.5 text-xs transition-colors ${
                        filterCategory === c ? 'bg-amber-ink font-medium text-ink-900' : 'bg-ink-700 text-parchment-dim hover:bg-ink-500'
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filtered.length === 0 ? (
              <p className="text-sm text-parchment-dim">Нічого не знайдено за вибраними фільтрами.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((article) => (
                  <WikiArticleCard key={article.id} article={article} onSelect={setSelectedArticle} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Бічна панель деталей */}
      {selectedArticle && (
        <aside className="w-96 shrink-0 overflow-y-auto rounded-lg border border-ink-500 bg-ink-800 px-6 py-5">
          <WikiArticleDetail
            article={selectedArticle}
            characters={characters} factions={factions} locations={locations}
            onClose={() => setSelectedArticle(null)}
            onEdit={(a) => setEditingArticle(a)}
            onDelete={(a) => setDeletingArticle(a)}
          />
        </aside>
      )}

      {/* Модалка створення */}
      <Modal title="Нова стаття" isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="max-w-xl">
        <WikiArticleForm
          characters={characters} factions={factions} locations={locations}
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Модалка редагування */}
      <Modal title="Редагувати статтю" isOpen={!!editingArticle} onClose={() => setEditingArticle(null)} maxWidth="max-w-xl">
        <WikiArticleForm
          initial={editingArticle}
          characters={characters} factions={factions} locations={locations}
          onSubmit={handleUpdate}
          onCancel={() => setEditingArticle(null)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Підтвердження видалення */}
      <ConfirmDialog
        isOpen={!!deletingArticle}
        onClose={() => setDeletingArticle(null)}
        onConfirm={handleDelete}
        title="Видалити статтю?"
        message={`Ви впевнені, що хочете видалити «${deletingArticle?.title}»? Цю дію не можна скасувати.`}
        confirmLabel="Видалити"
        isDangerous
      />
    </div>
  )
}

function EmptyState({ title, text, action }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-ink-500 px-6 py-16 text-center">
      <BookText size={28} strokeWidth={1.5} className="text-parchment-dim" />
      <h3 className="mt-4 font-display text-xl text-parchment">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-parchment-dim">{text}</p>
      {action}
    </div>
  )
}
