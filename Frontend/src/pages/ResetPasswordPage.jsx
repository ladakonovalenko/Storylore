import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading,         setLoading]         = useState(false)
  const [done,            setDone]            = useState(false)
  const [error,           setError]           = useState('')

  const inputCls = 'mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Пароль має містити щонайменше 6 символів')
      return
    }
    if (password !== confirmPassword) {
      setError('Паролі не збігаються')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // НОВЕ: якщо посилання відкрито без токена (наприклад, зайшли напряму на сторінку)
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-3xl font-medium text-parchment">StoryLore</h1>
          <p className="mt-4 text-sm text-crimson-soft">
            Посилання недійсне — відсутній токен скидання пароля.
          </p>
          <Link to="/forgot-password" className="mt-5 inline-block text-sm text-amber-soft hover:underline">
            Запросити нове посилання
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-medium text-parchment">StoryLore</h1>

        {done ? (
          <div className="mt-8 flex flex-col items-center rounded-lg border border-ink-500 bg-ink-800 px-6 py-8 text-center">
            <CheckCircle2 size={28} className="text-moss-soft" strokeWidth={1.5} />
            <h2 className="mt-4 font-display text-lg text-parchment">Пароль оновлено</h2>
            <p className="mt-2 text-sm text-parchment-dim">
              Зараз перенаправимо вас на сторінку входу…
            </p>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-parchment-dim">Встановіть новий пароль для акаунту.</p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
              <label className="block text-sm text-parchment-dim">
                Новий пароль
                <input
                  type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls} required autoFocus
                />
              </label>

              <label className="block text-sm text-parchment-dim">
                Підтвердіть пароль
                <input
                  type="password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls} required
                />
              </label>

              {error && (
                <p className="rounded-md border border-crimson-dim bg-crimson-dim/10 px-3 py-2 text-xs text-crimson-soft">
                  {error}
                </p>
              )}

              <button
                type="submit" disabled={loading}
                className="flex items-center justify-center gap-2 rounded-md bg-amber-ink py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft disabled:opacity-60"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Встановити новий пароль
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
