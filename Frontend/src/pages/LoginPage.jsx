import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { login, continueAsGuest } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(email, password)
      window.location.href = '/projects'
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const inputCls = 'mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none'

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-medium text-parchment">StoryLore</h1>
        <p className="mt-1 text-sm text-parchment-dim">Увійдіть у свій акаунт</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="block text-sm text-parchment-dim">
            Email
            <input
              type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className={inputCls} required
            />
          </label>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm text-parchment-dim">Пароль</label>
              {/* НОВЕ: посилання на відновлення пароля */}
              <Link to="/forgot-password" className="text-xs text-amber-soft hover:underline">
                Забули пароль?
              </Link>
            </div>
            <input
              type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls} required
            />
          </div>

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
            Увійти
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-ink-500" />
          <span className="text-xs text-parchment-dim/50">або</span>
          <div className="h-px flex-1 bg-ink-500" />
        </div>

        <button
          onClick={continueAsGuest}
          className="w-full rounded-md border border-ink-500 py-2 text-sm text-parchment-dim transition-colors hover:border-ink-300 hover:text-parchment"
        >
          Продовжити без акаунту
        </button>

        <p className="mt-2 text-center text-xs text-parchment-dim/50">
          Дані зберігатимуться лише на цьому пристрої
        </p>

        <p className="mt-5 text-center text-sm text-parchment-dim">
          Немає акаунту?{' '}
          <Link to="/register" className="text-amber-soft hover:underline">
            Зареєструватись
          </Link>
        </p>
      </div>
    </div>
  )
}
