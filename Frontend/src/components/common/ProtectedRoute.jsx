import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute() {
  const { user, isGuest, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900">
        <Loader2 size={24} className="animate-spin text-amber-soft" />
      </div>
    )
  }

  // ✅ Пропускаємо і авторизованих, і гостей
  return (user || isGuest) ? <Outlet /> : <Navigate to="/login" replace />
}
