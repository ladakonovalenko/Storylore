import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import SearchModal from './SearchModal'

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  // Автоматично закриваємо мобільне меню при переході на іншу сторінку
  useEffect(() => { setIsMobileMenuOpen(false) }, [location.pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-ink-900">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ВИПРАВЛЕНО: гамбургер тепер частина самого Header.jsx (onOpenMenu),
            а не окрема дубльована панель поверх нього */}
        <Header onOpenMenu={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
          <Outlet />
        </main>
      </div>

      <SearchModal />
    </div>
  )
}
