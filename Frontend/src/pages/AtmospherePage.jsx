import { useState, useEffect, useCallback } from 'react'
import { Plus, Music, Image as ImageIcon, Trash2, ExternalLink, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProject } from '../context/ProjectContext'
import { getProjectSoundtracks, createSoundtrack, deleteSoundtrack } from '../api/soundtracks'
import { getProjectMoodboardImages, createMoodboardImage, deleteMoodboardImage } from '../api/moodboard'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import InkStroke from '../components/layout/InkStroke'

const inputCls =
  'mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none'

// ── Форма треку ────────────────────────────────────────────────────────────────
function SoundtrackForm({ onSubmit, onCancel, isSubmitting }) {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const [touched, setTouched] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!title.trim() || !url.trim()) return
    onSubmit({ title: title.trim(), artist: artist.trim() || null, url: url.trim(), note: note.trim() || null })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="block text-sm text-parchment-dim">
        Назва пісні <span className="text-crimson-soft">*</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Назва треку…" className={inputCls} />
        {touched && !title.trim() && <span className="mt-1 block text-xs text-crimson-soft">Обов'язкове поле</span>}
      </label>
      <label className="block text-sm text-parchment-dim">
        Виконавець
        <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Хто виконує…" className={inputCls} />
      </label>
      <label className="block text-sm text-parchment-dim">
        Посилання (Spotify, YouTube Music тощо) <span className="text-crimson-soft">*</span>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://open.spotify.com/track/…" className={inputCls} />
        {touched && !url.trim() && <span className="mt-1 block text-xs text-crimson-soft">Обов'язкове поле</span>}
      </label>
      <label className="block text-sm text-parchment-dim">
        Чому ця пісня (необов'язково)
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
          placeholder="Асоціюється з певним персонажем чи моментом…" className={`${inputCls} resize-none`} />
      </label>
      <div className="mt-1 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-md px-4 py-2 text-sm text-parchment-dim hover:bg-ink-700">
          Скасувати
        </button>
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          Додати трек
        </button>
      </div>
    </form>
  )
}

// ── Форма зображення ──────────────────────────────────────────────────────────
function MoodboardForm({ onSubmit, onCancel, isSubmitting }) {
  const [imageUrl, setImageUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [touched, setTouched] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!imageUrl.trim()) return
    onSubmit({ image_url: imageUrl.trim(), caption: caption.trim() || null })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="block text-sm text-parchment-dim">
        Посилання на зображення <span className="text-crimson-soft">*</span>
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://i.pinimg.com/…" className={inputCls} />
        {touched && !imageUrl.trim() && <span className="mt-1 block text-xs text-crimson-soft">Обов'язкове поле</span>}
        <span className="mt-1 block text-xs text-parchment-dim/50">
          Скопіюйте посилання на зображення з Pinterest чи будь-якого сайту (правий клік → «Копіювати адресу зображення»)
        </span>
      </label>
      <label className="block text-sm text-parchment-dim">
        Підпис (необов'язково)
        <input value={caption} onChange={(e) => setCaption(e.target.value)}
          placeholder="Що це за атмосфера, локація, настрій…" className={inputCls} />
      </label>
      <div className="mt-1 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-md px-4 py-2 text-sm text-parchment-dim hover:bg-ink-700">
          Скасувати
        </button>
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          Додати зображення
        </button>
      </div>
    </form>
  )
}

// ── Головна сторінка ──────────────────────────────────────────────────────────
export default function AtmospherePage() {
  const { activeProject, activeProjectId } = useProject()

  const [tab, setTab] = useState('music') // 'music' | 'moodboard'
  const [tracks, setTracks] = useState([])
  const [images, setImages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [deletingTrack, setDeletingTrack] = useState(null)
  const [deletingImage, setDeletingImage] = useState(null)

  const load = useCallback(async () => {
    if (!activeProjectId) { setTracks([]); setImages([]); return }
    setIsLoading(true); setError(null)
    try {
      const [t, i] = await Promise.all([
        getProjectSoundtracks(activeProjectId),
        getProjectMoodboardImages(activeProjectId),
      ])
      setTracks(t)
      setImages(i)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [activeProjectId])

  useEffect(() => { load() }, [load])

  const handleCreateTrack = async (payload) => {
    setIsSubmitting(true)
    try {
      const created = await createSoundtrack({ ...payload, project_id: activeProjectId })
      setTracks((prev) => [created, ...prev])
      toast.success('Трек додано')
      setIsTrackModalOpen(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTrack = async () => {
    if (!deletingTrack) return
    try {
      await deleteSoundtrack(deletingTrack.id)
      setTracks((prev) => prev.filter((t) => t.id !== deletingTrack.id))
      setDeletingTrack(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleCreateImage = async (payload) => {
    setIsSubmitting(true)
    try {
      const created = await createMoodboardImage({ ...payload, project_id: activeProjectId })
      setImages((prev) => [created, ...prev])
      toast.success('Зображення додано')
      setIsImageModalOpen(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteImage = async () => {
    if (!deletingImage) return
    try {
      await deleteMoodboardImage(deletingImage.id)
      setImages((prev) => prev.filter((i) => i.id !== deletingImage.id))
      setDeletingImage(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const projectTitle = activeProject?.title || activeProject?.name || null

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-medium text-parchment">Атмосфера</h2>
          <InkStroke className="mt-1" width={90} />
          {projectTitle && (
            <p className="mt-2 text-sm text-parchment-dim">
              Проєкт: <span className="text-parchment">{projectTitle}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => {
            if (!activeProjectId) { toast.error('Спочатку оберіть активний проєкт'); return }
            tab === 'music' ? setIsTrackModalOpen(true) : setIsImageModalOpen(true)
          }}
          className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft"
        >
          <Plus size={16} /> {tab === 'music' ? 'Додати трек' : 'Додати зображення'}
        </button>
      </div>

      {/* Перемикач вкладок */}
      <div className="mt-5 flex items-center gap-1 rounded-md border border-ink-500 p-0.5" style={{ width: 'fit-content' }}>
        <button onClick={() => setTab('music')}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors ${
            tab === 'music' ? 'bg-ink-600 text-parchment' : 'text-parchment-dim hover:text-parchment'
          }`}>
          <Music size={14} /> Саундтрек
        </button>
        <button onClick={() => setTab('moodboard')}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors ${
            tab === 'moodboard' ? 'bg-ink-600 text-parchment' : 'text-parchment-dim hover:text-parchment'
          }`}>
          <ImageIcon size={14} /> Мудборд
        </button>
      </div>

      <div className="mt-6">
        {!activeProjectId ? (
          <p className="text-sm text-parchment-dim">
            Атмосфера прив'язана до конкретного проєкту. Оберіть або створіть проєкт.
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

        ) : tab === 'music' ? (
          tracks.length === 0 ? (
            <EmptyState icon={<Music size={28} strokeWidth={1.5} className="text-parchment-dim" />}
              title="Саундтреку ще немає"
              text="Додайте пісні, що передають атмосферу вашого світу — з посиланням на Spotify, YouTube Music чи будь-який інший сервіс." />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tracks.map((t) => (
                <div key={t.id} className="group flex flex-col rounded-lg border border-ink-500 bg-ink-800 px-5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-medium text-parchment">{t.title}</p>
                      {t.artist && <p className="truncate text-sm text-parchment-dim">{t.artist}</p>}
                    </div>
                    <button onClick={() => setDeletingTrack(t)}
                      className="shrink-0 rounded p-1 text-parchment-dim opacity-0 transition-opacity hover:bg-crimson-dim/30 hover:text-crimson-soft group-hover:opacity-100">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {t.note && <p className="mt-2 text-sm text-parchment-dim">{t.note}</p>}
                  <a href={t.url} target="_blank" rel="noopener noreferrer"
                    className="mt-3 flex w-fit items-center gap-1.5 text-xs text-amber-soft hover:underline">
                    <ExternalLink size={12} /> Слухати
                  </a>
                </div>
              ))}
            </div>
          )

        ) : (
          images.length === 0 ? (
            <EmptyState icon={<ImageIcon size={28} strokeWidth={1.5} className="text-parchment-dim" />}
              title="Мудборд ще порожній"
              text="Додайте зображення з Pinterest чи будь-якого сайту, щоб краще відчувати атмосферу вашого проєкту." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((img) => (
                <div key={img.id} className="group relative overflow-hidden rounded-lg border border-ink-500 bg-ink-800">
                  <img src={img.image_url} alt={img.caption || ''}
                    className="aspect-square w-full object-cover" loading="lazy" />
                  <button onClick={() => setDeletingImage(img)}
                    className="absolute right-2 top-2 rounded bg-ink-900/80 p-1.5 text-parchment-dim opacity-0 transition-opacity hover:text-crimson-soft group-hover:opacity-100">
                    <Trash2 size={13} />
                  </button>
                  {img.caption && (
                    <p className="bg-ink-900/80 px-2 py-1.5 text-xs text-parchment-dim">{img.caption}</p>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Модалки */}
      <Modal title="Новий трек" isOpen={isTrackModalOpen} onClose={() => setIsTrackModalOpen(false)}>
        <SoundtrackForm onSubmit={handleCreateTrack} onCancel={() => setIsTrackModalOpen(false)} isSubmitting={isSubmitting} />
      </Modal>
      <Modal title="Нове зображення" isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)}>
        <MoodboardForm onSubmit={handleCreateImage} onCancel={() => setIsImageModalOpen(false)} isSubmitting={isSubmitting} />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingTrack} onClose={() => setDeletingTrack(null)}
        onConfirm={handleDeleteTrack} title="Видалити трек?"
        message={`Видалити «${deletingTrack?.title}» зі списку?`} confirmLabel="Видалити" isDangerous
      />
      <ConfirmDialog
        isOpen={!!deletingImage} onClose={() => setDeletingImage(null)}
        onConfirm={handleDeleteImage} title="Видалити зображення?"
        message="Видалити це зображення з мудборду?" confirmLabel="Видалити" isDangerous
      />
    </div>
  )
}

function EmptyState({ icon, title, text }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-ink-500 px-6 py-16 text-center">
      {icon}
      <h3 className="mt-4 font-display text-xl text-parchment">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-parchment-dim">{text}</p>
    </div>
  )
}
