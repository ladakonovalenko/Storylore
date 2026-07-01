import { createContext, useContext, useState, useEffect } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)
const GUEST_KEY = 'storylore.isGuest'

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null)
  const [isGuest,   setIsGuest]   = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedGuest = localStorage.getItem(GUEST_KEY) === 'true'
    if (savedGuest) {
      setIsGuest(true)
      setIsLoading(false)
      return
    }
    const token = localStorage.getItem('access_token')
    if (!token) { setIsLoading(false); return }

    client.get('/auth/me')
      .then(({ data }) => setUser(data))
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password })
    localStorage.setItem('access_token',  data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    localStorage.removeItem(GUEST_KEY)
    setIsGuest(false)
    setUser(data.user)
    return data
  }

  const register = async (email, username, password) => {
    const { data } = await client.post('/auth/register', { email, username, password })
    localStorage.setItem('access_token',  data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    localStorage.removeItem(GUEST_KEY)
    setIsGuest(false)
    setUser(data.user)
    return data
  }

  const continueAsGuest = () => {
    localStorage.setItem(GUEST_KEY, 'true')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    setIsGuest(true)
    window.location.href = '/projects'
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem(GUEST_KEY)
    setUser(null)
    setIsGuest(false)
  }

  // НОВЕ: запит на скидання пароля — надсилає лист з посиланням, якщо email існує
  const forgotPassword = async (email) => {
    const { data } = await client.post('/auth/forgot-password', { email })
    return data
  }

  // НОВЕ: встановлення нового пароля за токеном з листа
  const resetPassword = async (token, newPassword) => {
    const { data } = await client.post('/auth/reset-password', { token, new_password: newPassword })
    return data
  }

  return (
    <AuthContext.Provider value={{
      user, setUser,
      isGuest, isLoading,
      login, register, logout, continueAsGuest,
      forgotPassword, resetPassword, // НОВЕ
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth має використовуватися всередині <AuthProvider>')
  return ctx
}
