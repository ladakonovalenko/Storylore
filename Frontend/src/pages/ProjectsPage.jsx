import { useState } from 'react'
import { Plus, BookOpen, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProject } from '../context/ProjectContext'
import { createProject, updateProject, deleteProject } from '../api/projects'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import ProjectCard from '../components/projects/ProjectCard'
import CreateProjectForm from '../components/projects/CreateProjectForm'
import InkStroke from '../components/layout/InkStroke'

// НОВЕ: проста форма редагування (назва + опис), стилізована так само,
// як інпути в CharacterForm — щоб не залежати від невідомого коду CreateProjectForm.
function EditProjectForm({ initial, onSubmit, onCancel, isSubmitting }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [touched, setTouched] = useState(false)

  const inputCls =
    'mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none'

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!title.trim()) return
    onSubmit({ title: title.trim(), description: description.trim() || null })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="block text-sm text-parchment-dim">
        Назва проєкту<span className="ml-1 text-crimson-soft">*</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Назва світу/проєкту…"
          className={inputCls}
        />
        {touched && !title.trim() && (
          <span className="mt-1 block text-xs text-crimson-soft">Назва не може бути порожньою</span>
        )}
      </label>

      <label className="block text-sm text-parchment-dim">
        Опис
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Короткий опис проєкту…"
          className={`${inputCls} resize-none`}
        />
      </label>

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm text-parchment-dim hover:bg-ink-700"
        >
          Скасувати
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          Зберегти зміни
        </button>
      </div>
    </form>
  )
}

export default function ProjectsPage() {
  const { projects, activeProjectId, setActiveProjectId, isLoading, error, refreshProjects } =
    useProject()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // НОВЕ: стан для редагування
  const [editingProject, setEditingProject] = useState(null) // null = закрито, об'єкт = редагуємо
  const [isUpdating, setIsUpdating] = useState(false)

  // НОВЕ: стан для видалення
  const [deletingProject, setDeletingProject] = useState(null) // null = закрито
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCreate = async (payload) => {
    setIsSubmitting(true)
    try {
      const newProject = await createProject(payload)
      await refreshProjects()
      if (newProject?.id !== undefined) {
        setActiveProjectId(newProject.id)
      }
      toast.success(`Проєкт «${payload.title}» створено`)
      setIsModalOpen(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // НОВЕ: збереження редагування
  const handleUpdate = async (payload) => {
    if (!editingProject) return
    setIsUpdating(true)
    try {
      await updateProject(editingProject.id, payload)
      await refreshProjects()
      toast.success(`Проєкт «${payload.title}» оновлено`)
      setEditingProject(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  // НОВЕ: підтверджене видалення
  const handleDelete = async () => {
    if (!deletingProject) return
    setIsDeleting(true)
    try {
      await deleteProject(deletingProject.id)
      await refreshProjects()
      // Якщо видалили активний проєкт — скидаємо активний вибір
      if (String(activeProjectId) === String(deletingProject.id)) {
        setActiveProjectId(null)
      }
      toast.success(`Проєкт «${deletingProject.title || deletingProject.name}» видалено`)
      setDeletingProject(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-medium text-parchment">Проєкти</h2>
          <InkStroke className="mt-1" width={90} />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft"
        >
          <Plus size={16} />
          Новий проєкт
        </button>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-lg border border-ink-500 bg-ink-800"
              />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-crimson-soft">{error}</p>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-ink-500 px-6 py-16 text-center">
            <BookOpen size={28} className="text-parchment-dim" strokeWidth={1.5} />
            <h3 className="mt-4 font-display text-xl text-parchment">Ще немає жодного світу</h3>
            <p className="mt-2 max-w-sm text-sm text-parchment-dim">
              Створіть перший проєкт, щоб почати наповнювати його персонажами, фракціями та
              зв&rsquo;язками.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-5 flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft"
            >
              <Plus size={16} />
              Створити перший проєкт
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isActive={String(project.id) === String(activeProjectId)}
                onSelect={() => {
                  setActiveProjectId(project.id)
                  toast.success(`«${project.title || project.name}» тепер активний проєкт`)
                }}
                // НОВЕ: пропси для редагування/видалення.
                // ProjectCard.jsx ще потрібно доповнити кнопками, які їх викликають.
                onEdit={() => setEditingProject(project)}
                onDelete={() => setDeletingProject(project)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Модалка створення (без змін) */}
      <Modal title="Новий проєкт" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CreateProjectForm
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* НОВЕ: Модалка редагування */}
      <Modal
        title="Редагувати проєкт"
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
      >
        <EditProjectForm
          initial={editingProject}
          onSubmit={handleUpdate}
          onCancel={() => setEditingProject(null)}
          isSubmitting={isUpdating}
        />
      </Modal>

      {/* НОВЕ: Діалог підтвердження видалення */}
      <ConfirmDialog
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleDelete}
        title="Видалити проєкт?"
        message={`Ви впевнені, що хочете видалити «${deletingProject?.title || deletingProject?.name}»? Усі персонажі та фракції цього проєкту будуть видалені без можливості відновлення.`}
        confirmLabel="Видалити"
        isDangerous
      />
    </div>
  )
}
