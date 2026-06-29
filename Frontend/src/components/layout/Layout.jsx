import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import SearchModal from './SearchModal'

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-ink-900">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <Outlet />
        </main>
      </div>
      {/* НОВЕ: глобальна модалка пошуку (Ctrl+K), доступна з будь-якої сторінки */}
      <SearchModal />
    </div>
  )
}
