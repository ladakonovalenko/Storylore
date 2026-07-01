import { useState, useEffect, useCallback } from 'react'
import { Plus, Music, Image as ImageIcon, Trash2, ExternalLink, Loader2, Pencil, ImageOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProject } from '../context/ProjectContext'
import { getProjectSoundtracks, createSoundtrack, updateSoundtrack, deleteSoundtrack } from '../api/soundtracks'
import { getProjectMoodboardImages, createMoodboardImage, updateMoodboardImage, deleteMoodboardImage } from '../api/moodboard'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import InkStroke from '../components/layout/InkStroke'

const inputCls =
  'mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none'

// ── Форма треку (тепер універсальна: створення + редагування) ──────────────────
function SoundtrackForm({ initial, onSubmit, onCancel, isSubmitting }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [artist, setArtist] = useState(initial?.artist ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
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
          {initial ? 'Зберегти зміни' : 'Додати трек'}
        </button>
      </div>
    </form>
  )
}

// ── Форма зображення (тепер універсальна: створення + редагування) ─────────────
function MoodboardForm({ initial, onSubmit, onCancel, isSubmitting }) {
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '')
  const [caption, setCaption] = useState(initial?.caption ?? '')
  const [touched, setTouched] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!imageUrl.trim()) return
    onSubmit({ image_url: imageUrl.trim(), caption: caption.trim() || null })
  }

  // НОВЕ: попереджаємо одразу у формі, якщо посилання схоже на сторінку Pinterest
  // (pinterest.com/pin/...), а не на пряме зображення — це і є причина,
  // чому картинка потім не відображається.
  const looksLikePinterestPage = /pinterest\.[a-z.]+\/pin\//i.test(imageUrl) && !/\.(jpe?g|png|webp|gif)(\?|$)/i.test(imageUrl)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="block text-sm text-parchment-dim">
        Посилання на зображення <span className="text-crimson-soft">*</span>
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://i.pinimg.com/…" className={inputCls} />
        {touched && !imageUrl.trim() && <span className="mt-1 block text-xs text-crimson-soft">Обов'язкове поле</span>}
        <span className="mt-1 block text-xs text-parchment-dim/50">
          Потрібне саме пряме посилання на файл зображення, а не на сторінку.
          На Pinterest: відкрийте пін на весь екран → правий клік по фото → «Копіювати адресу зображення»
          (адреса має виглядати як <code>https://i.pinimg.com/…</code>, а не <code>pinterest.com/pin/…</code>).
        </span>
        {looksLikePinterestPage && (
          <span className="mt-1.5 block rounded-md bg-amber-ink/10 px-2.5 py-1.5 text-xs text-amber-soft">
            ⚠ Схоже, це посилання на сторінку піна, а не на саму картинку — вона, ймовірно, не відобразиться.
            Скопіюйте адресу зображення, як описано вище.
          </span>
        )}
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
          {initial ? 'Зберегти зміни' : 'Додати зображення'}
        </button>
      </div>
    </form>
  )
}

// НОВЕ: картка зображення мудборду з обробкою помилки завантаження —
// якщо пряме посилання все ж не відкривається (наприклад, Pinterest
// згодом змінив/видалив файл), показуємо акуратний fallback замість
// зламаної іконки браузера, і даємо посилання відкрити оригінал.
function MoodboardImageCard({ img, onEdit, onDelete }) {
  const [broken, setBroken] = useState(false)

  return (
    <div className="group relative overflow-hidden rounded-lg border border-ink-500 bg-ink-800">
      {broken ? (
        <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-ink-700 px-3 text-center">
          <ImageOff size={22} className="text-parchment-dim" />
          <p className="text-xs text-parchment-dim">Зображення не завантажилось</p>
          <a href={img.image_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-amber-soft hover:underline">
            <ExternalLink size={11} /> Відкрити посилання
          </a>
        </div>
      ) : (
        <img
          src={img.image_url}
          alt={img.caption || ''}
          className="aspect-square w-full object-cover"
          loading="lazy"
          onError={() => setBroken(true)}
        />
      )}

      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={() => onEdit(img)}
          className="rounded bg-ink-900/80 p-1.5 text-parchment-dim hover:text-amber-soft" aria-label="Редагувати">
          <Pencil size={13} />
        </button>
        <button onClick={() => onDelete(img)}
          className="rounded bg-ink-900/80 p-1.5 text-parchment-dim hover:text-crimson-soft" aria-label="Видалити">
          <Trash2 size={13} />
        </button>
      </div>

      {img.caption && (
        <p className="bg-ink-900/80 px-2 py-1.5 text-xs text-parchment-dim">{img.caption}</p>
      )}
    </div>
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
  // НОВЕ: окремий стан для редагованого елемента — якщо не null, модалка працює в режимі "редагувати"
  const [editingTrack, setEditingTrack] = useState(null)
  const [editingImage, setEditingImage] = useState(null)
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

  // ── Треки: створення або редагування одним обробником ──────────────────────
  const handleSubmitTrack = async (payload) => {
    setIsSubmitting(true)
    try {
      if (editingTrack) {
        const updated = await updateSoundtrack(editingTrack.id, payload)
        setTracks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
        toast.success('Трек оновлено')
      } else {
        const created = await createSoundtrack({ ...payload, project_id: activeProjectId })
        setTracks((prev) => [created, ...prev])
        toast.success('Трек додано')
      }
      setIsTrackModalOpen(false)
      setEditingTrack(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditTrack = (track) => { setEditingTrack(track); setIsTrackModalOpen(true) }
  const openNewTrack = () => { setEditingTrack(null); setIsTrackModalOpen(true) }
  const closeTrackModal = () => { setIsTrackModalOpen(false); setEditingTrack(null) }

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

  // ── Зображення: створення або редагування одним обробником ─────────────────
  const handleSubmitImage = async (payload) => {
    setIsSubmitting(true)
    try {
      if (editingImage) {
        const updated = await updateMoodboardImage(editingImage.id, payload)
        setImages((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
        toast.success('Зображення оновлено')
      } else {
        const created = await createMoodboardImage({ ...payload, project_id: activeProjectId })
        setImages((prev) => [created, ...prev])
        toast.success('Зображення додано')
      }
      setIsImageModalOpen(false)
      setEditingImage(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditImage = (img) => { setEditingImage(img); setIsImageModalOpen(true) }
  const openNewImage = () => { setEditingImage(null); setIsImageModalOpen(true) }
  const closeImageModal = () => { setIsImageModalOpen(false); setEditingImage(null) }

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
          <p className="mt-2 max-w-xl text-sm text-parchment-dim">
            Саундтрек і мудборд вашого світу — музика та зображення, що передають настрій
            і надихають на творчість.
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
            tab === 'music' ? openNewTrack() : openNewImage()
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
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => openEditTrack(t)}
                        className="rounded p-1 text-parchment-dim hover:bg-amber-ink/10 hover:text-amber-soft" aria-label="Редагувати">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeletingTrack(t)}
                        className="rounded p-1 text-parchment-dim hover:bg-crimson-dim/30 hover:text-crimson-soft" aria-label="Видалити">
                        <Trash2 size={14} />
                      </button>
                    </div>
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
                <MoodboardImageCard
                  key={img.id} img={img}
                  onEdit={openEditImage}
                  onDelete={(i) => setDeletingImage(i)}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Модалки */}
      <Modal title={editingTrack ? 'Редагувати трек' : 'Новий трек'} isOpen={isTrackModalOpen} onClose={closeTrackModal}>
        <SoundtrackForm initial={editingTrack} onSubmit={handleSubmitTrack} onCancel={closeTrackModal} isSubmitting={isSubmitting} />
      </Modal>
      <Modal title={editingImage ? 'Редагувати зображення' : 'Нове зображення'} isOpen={isImageModalOpen} onClose={closeImageModal}>
        <MoodboardForm initial={editingImage} onSubmit={handleSubmitImage} onCancel={closeImageModal} isSubmitting={isSubmitting} />
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
