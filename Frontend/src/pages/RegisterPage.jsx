import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const { register } = useAuth()

  const [email,    setEmail]    = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await register(email, username, password)
      // ✅ Повне перезавантаження — щоб ProjectContext стартував з токеном
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
        <p className="mt-1 text-sm text-parchment-dim">Створіть акаунт</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="block text-sm text-parchment-dim">
            Ім'я користувача
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ваше ім'я"
              className={inputCls} required
            />
          </label>

          <label className="block text-sm text-parchment-dim">
            Email
            <input
              type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className={inputCls} required
            />
          </label>

          <label className="block text-sm text-parchment-dim">
            Пароль
            <input
              type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Мінімум 8 символів"
              className={inputCls} required minLength={8}
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
            Зареєструватись
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-parchment-dim">
          Вже є акаунт?{' '}
          <Link to="/login" className="text-amber-soft hover:underline">
            Увійти
          </Link>
        </p>
      </div>
    </div>
  )
}
