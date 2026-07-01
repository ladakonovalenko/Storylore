import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()

  const [email,     setEmail]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [sent,      setSent]      = useState(false)
  const [error,     setError]     = useState('')

  const inputCls = 'mt-1 w-full rounded-md border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus:border-amber-ink focus:outline-none'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await forgotPassword(email)
      // ВАЖЛИВО: бекенд завжди повертає однакову відповідь незалежно від того,
      // чи існує такий email — фронтенд теж завжди показує один і той самий стан
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-medium text-parchment">StoryLore</h1>

        {sent ? (
          <div className="mt-8 flex flex-col items-center rounded-lg border border-ink-500 bg-ink-800 px-6 py-8 text-center">
            <MailCheck size={28} className="text-amber-soft" strokeWidth={1.5} />
            <h2 className="mt-4 font-display text-lg text-parchment">Перевірте пошту</h2>
            <p className="mt-2 text-sm text-parchment-dim">
              Якщо на <span className="text-parchment">{email}</span> зареєстровано акаунт,
              ми надіслали лист із посиланням для скидання пароля. Посилання дійсне 1 годину.
            </p>
            <Link to="/login" className="mt-5 text-sm text-amber-soft hover:underline">
              Повернутись до входу
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-parchment-dim">
              Введіть email, і ми надішлемо посилання для скидання пароля.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
              <label className="block text-sm text-parchment-dim">
                Email
                <input
                  type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={inputCls} required autoFocus
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
                Надіслати посилання
              </button>
            </form>

            <Link to="/login" className="mt-5 flex items-center justify-center gap-1.5 text-sm text-parchment-dim hover:text-parchment">
              <ArrowLeft size={14} /> Повернутись до входу
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
