import { useState } from 'react'
import { UserCircle, LogOut, BookOpen, Edit3, Check, X, Loader2, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useProject } from '../context/ProjectContext'
import { Link } from 'react-router-dom'
import client from '../api/client'
import toast from 'react-hot-toast'
import InkStroke from '../components/layout/InkStroke'

// ── Inline-поле редагування ───────────────────────────────────────────────────
function EditableField({ label, value, onSave, type = 'text', placeholder }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value ?? '')
  const [saving,  setSaving]  = useState(false)

  const commit = async () => {
    if (draft === value) { setEditing(false); return }
    setSaving(true)
    try {
      await onSave(draft)
      setEditing(false)
    } catch {
      // помилка вже показана через toast
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => { setDraft(value ?? ''); setEditing(false) }

  const inputCls = 'w-full rounded-md border border-amber-ink bg-ink-900 px-3 py-1.5 text-sm text-parchment focus:outline-none'

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-widest text-parchment-dim/60">
        {label}
      </span>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus type={type} value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            className={inputCls}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }}
          />
          <button onClick={commit} disabled={saving}
            className="flex items-center rounded bg-amber-ink p-1.5 text-ink-900 hover:bg-amber-soft disabled:opacity-60">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          </button>
          <button onClick={cancel}
            className="rounded p-1.5 text-parchment-dim hover:bg-ink-700">
            <X size={13} />
          </button>
        </div>
      ) : (
        <div className="group flex items-center justify-between gap-2">
          <span className="text-sm text-parchment">{value || <span className="italic text-parchment-dim/50">Не вказано</span>}</span>
          <button
            onClick={() => { setDraft(value ?? ''); setEditing(true) }}
            className="flex items-center gap-1 text-xs text-parchment-dim opacity-0 transition-opacity hover:text-amber-soft group-hover:opacity-100"
          >
            <Edit3 size={11} /> Змінити
          </button>
        </div>
      )}
    </div>
  )
}

// ── Блок зміни пароля ─────────────────────────────────────────────────────────
function ChangePasswordBlock() {
  const [open,        setOpen]        = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [saving,      setSaving]      = useState(false)

  const inputCls = 'mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-1.5 text-sm text-parchment focus:border-amber-ink focus:outline-none'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirm) { toast.error('Паролі не збігаються'); return }
    if (newPassword.length < 8)  { toast.error('Пароль має бути мінімум 8 символів'); return }
    setSaving(true)
    try {
      await client.put('/auth/me/password', {
        old_password: oldPassword,
        new_password: newPassword,
      })
      toast.success('Пароль змінено')
      setOldPassword(''); setNewPassword(''); setConfirm('')
      setOpen(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border-t border-ink-500 pt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm text-parchment-dim hover:text-parchment"
      >
        <Lock size={14} />
        {open ? 'Скасувати зміну пароля' : 'Змінити пароль'}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
          <label className="block text-xs text-parchment-dim">
            Поточний пароль
            <input type="password" value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className={inputCls} required />
          </label>
          <label className="block text-xs text-parchment-dim">
            Новий пароль
            <input type="password" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Мінімум 8 символів"
              className={inputCls} required minLength={8} />
          </label>
          <label className="block text-xs text-parchment-dim">
            Підтвердити новий пароль
            <input type="password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputCls} required />
          </label>
          <button type="submit" disabled={saving}
            className="flex items-center justify-center gap-2 rounded-md bg-amber-ink py-1.5 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60">
            {saving && <Loader2 size={13} className="animate-spin" />}
            Зберегти новий пароль
          </button>
        </form>
      )}
    </div>
  )
}

// ── Головний компонент ────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, isGuest, logout, setUser } = useAuth()
  const { projects } = useProject()

  const handleLogout = () => { logout(); window.location.href = '/login' }

  // Оновлення поля профілю
  const updateField = async (field, value) => {
    try {
      const { data } = await client.put('/auth/me', { [field]: value })
      setUser(data)
      toast.success('Збережено')
    } catch (err) {
      toast.error(err.message)
      throw err
    }
  }

  // ── Гість ────────────────────────────────────────────────────────────────
  if (isGuest) {
    return (
      <div>
        <h2 className="font-display text-3xl font-medium text-parchment">Профіль</h2>
        <InkStroke className="mt-1" width={80} />
        <div className="mt-8 flex flex-col items-center gap-4 rounded-lg border border-dashed border-ink-500 px-6 py-16 text-center">
          <UserCircle size={48} strokeWidth={1.25} className="text-parchment-dim/40" />
          <h3 className="font-display text-xl text-parchment">Ви у гостьовому режимі</h3>
          <p className="max-w-sm text-sm text-parchment-dim">
            Ваші дані зберігаються лише на цьому пристрої. Зареєструйтесь щоб мати доступ
            до своїх проєктів з будь-якого пристрою.
          </p>
          <div className="flex gap-3">
            <Link to="/register"
              className="rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft">
              Зареєструватись
            </Link>
            <Link to="/login"
              className="rounded-md border border-ink-500 px-4 py-2 text-sm text-parchment-dim hover:border-ink-300">
              Увійти
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  const initials = user.username
    ? user.username.slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase()

  return (
    <div>
      <h2 className="font-display text-3xl font-medium text-parchment">Профіль</h2>
      <InkStroke className="mt-1" width={80} />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── Картка профілю ── */}
        <div className="flex flex-col gap-5 rounded-lg border border-ink-500 bg-ink-800 px-6 py-6">

          {/* Аватар */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-ink bg-ink-700">
              <span className="font-display text-2xl font-medium text-amber-soft">
                {initials}
              </span>
            </div>
          </div>

          {/* Редаговані поля */}
          <div className="flex flex-col gap-4">
            <EditableField
              label="Ім'я користувача"
              value={user.username}
              placeholder="Ваше ім'я"
              onSave={(val) => updateField('username', val)}
            />
            <EditableField
              label="Email"
              value={user.email}
              type="email"
              placeholder="your@email.com"
              onSave={(val) => updateField('email', val)}
            />
          </div>

          {/* Статистика */}
          <div className="flex flex-col gap-2 border-t border-ink-500 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-parchment-dim">
                <BookOpen size={14} /> Проєктів
              </span>
              <span className="font-medium text-parchment">{projects.length}</span>
            </div>
          </div>

          {/* Зміна пароля */}
          <ChangePasswordBlock />

          {/* Вихід */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 rounded-md border border-ink-500 px-4 py-2 text-sm text-parchment-dim transition-colors hover:border-crimson-dim hover:text-crimson-soft"
          >
            <LogOut size={14} />
            Вийти з акаунту
          </button>
        </div>

        {/* ── Список проєктів ── */}
        <div className="lg:col-span-2">
          <h3 className="mb-4 font-display text-lg font-medium text-parchment">Мої проєкти</h3>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center rounded-lg border border-dashed border-ink-500 px-6 py-12 text-center">
              <BookOpen size={24} strokeWidth={1.5} className="text-parchment-dim" />
              <p className="mt-3 text-sm text-parchment-dim">Проєктів ще немає</p>
              <Link to="/projects"
                className="mt-4 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft">
                Створити перший проєкт
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {projects.map((project) => (
                <div key={project.id}
                  className="flex items-center justify-between rounded-lg border border-ink-500 bg-ink-800 px-5 py-4 transition-colors hover:border-ink-300">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-medium text-parchment">
                      {project.title || project.name}
                    </p>
                    {project.description && (
                      <p className="mt-0.5 truncate text-sm text-parchment-dim">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <Link to="/projects"
                    className="ml-4 shrink-0 text-xs text-parchment-dim hover:text-amber-soft">
                    Відкрити →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
