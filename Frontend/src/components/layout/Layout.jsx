import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'
import SearchModal from './SearchModal'

export default function Layout() {
  // НОВЕ: стан мобільного бічного меню
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  // НОВЕ: автоматично закриваємо мобільне меню при переході на іншу сторінку
  useEffect(() => { setIsMobileMenuOpen(false) }, [location.pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-ink-900">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* НОВЕ: компактна мобільна панель з гамбургер-кнопкою — видима лише на вузьких
            екранах (md:hidden). Не чіпаємо сам Header.jsx, щоб не зламати його вміст наосліп. */}
        <div className="flex items-center gap-3 border-b border-ink-500 px-4 py-2.5 md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="rounded-md p-1.5 text-parchment-dim hover:bg-ink-700 hover:text-parchment"
            aria-label="Відкрити меню"
          >
            <Menu size={20} />
          </button>
          <span className="font-display text-base font-medium text-parchment">StoryLore</span>
        </div>

        <Header />
        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
          <Outlet />
        </main>
      </div>

      {/* Глобальна модалка пошуку (Ctrl+K), доступна з будь-якої сторінки */}
      <SearchModal />
    </div>
  )
}
