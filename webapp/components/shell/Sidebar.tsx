'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from './SidebarContext'

/* Inline SVG icons */
const icons = {
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  chat: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  history: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  menu: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  collapse: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="11 17 6 12 11 7"/><line x1="18" y1="12" x2="6" y2="12"/></svg>,
  expand: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="13 17 18 12 13 7"/><line x1="6" y1="12" x2="18" y2="12"/></svg>,
}

const navItems = [
  { href: '/chat', label: 'Chat', icon: icons.chat },
  { href: '/chat/history', label: 'History', icon: icons.history },
]

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: icons.settings },
  { href: '/profile', label: 'Profile', icon: icons.user },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { isOpen, mobileOpen, toggle, toggleMobile, closeMobile, onNewChat } = useSidebar()

  return (
    <>
      {/* ─── Desktop sidebar (icon rail) ─── */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-screen glass-sidebar z-40 flex-col items-center justify-between py-5 border-r border-white/20 transition-all duration-200 ease-in-out ${
          isOpen ? 'w-[56px]' : 'w-0 overflow-hidden border-r-0'
        }`}
      >
        <div className="flex flex-col items-center gap-1.5">
          {/* Logo */}
          <Link href="/chat" className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden focus-ring shrink-0">
            <img src="/images/logo.png" alt="N" className="h-9 w-9 object-cover" />
          </Link>

          {/* New chat — in-app reset */}
          <button
            onClick={onNewChat}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-accent/80 hover:text-accent hover:bg-accent/8 transition-all focus-ring mb-1 shrink-0"
            title="New chat"
          >
            {icons.plus}
          </button>

          <div className="w-5 h-px bg-black/8 my-1" />

          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/chat' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all focus-ring shrink-0 ${
                  active ? 'bg-accent/10 text-accent' : 'text-text-secondary/70 hover:text-text-primary hover:bg-black/4'
                }`}
              >
                {item.icon}
              </Link>
            )
          })}
        </div>

        <div className="flex flex-col items-center gap-1.5">
          {bottomItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all focus-ring shrink-0 ${
                  active ? 'bg-accent/10 text-accent' : 'text-text-secondary/70 hover:text-text-primary hover:bg-black/4'
                }`}
              >
                {item.icon}
              </Link>
            )
          })}

          {/* Collapse toggle */}
          <button
            onClick={toggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary/40 hover:text-text-primary hover:bg-black/4 transition-all mt-1 shrink-0"
            title="Collapse sidebar"
          >
            {icons.collapse}
          </button>
        </div>
      </aside>

      {/* ─── Desktop expand button (when collapsed) ─── */}
      {!isOpen && (
        <button
          onClick={toggle}
          className="hidden md:flex fixed left-3 top-4 z-50 h-8 w-8 items-center justify-center rounded-lg glass text-text-secondary/50 hover:text-text-primary transition-all"
          title="Open sidebar"
        >
          {icons.expand}
        </button>
      )}

      {/* ─── Mobile top bar ─── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 glass-strong border-b border-white/20 h-12 flex items-center justify-between px-3">
        <button
          onClick={toggleMobile}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary/60 hover:text-text-primary transition-all"
        >
          {icons.menu}
        </button>
        <Link href="/chat" className="flex items-center gap-2">
          <img src="/images/logo.png" alt="N" className="h-6 w-6 rounded-md" />
          <span className="text-sm font-semibold">Nyayantar</span>
        </Link>
        <button
          onClick={onNewChat}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-accent/70 hover:text-accent transition-all"
          title="New chat"
        >
          {icons.plus}
        </button>
      </div>

      {/* ─── Mobile slide-out drawer ─── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div className="md:hidden fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={closeMobile} />
          {/* Drawer */}
          <aside className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-64 glass-strong border-r border-white/20 flex flex-col animate-in">
            <div className="flex items-center justify-between p-4 border-b border-black/5">
              <div className="flex items-center gap-2">
                <img src="/images/logo.png" alt="N" className="h-7 w-7 rounded-lg" />
                <span className="font-semibold text-sm">Nyayantar</span>
              </div>
              <button onClick={closeMobile} className="h-8 w-8 flex items-center justify-center rounded-lg text-text-secondary/50 hover:text-text-primary transition-all">
                {icons.close}
              </button>
            </div>

            <div className="flex-1 p-3 space-y-1">
              <button
                onClick={() => { onNewChat(); closeMobile() }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-accent/80 hover:bg-accent/6 transition-all text-sm font-medium"
              >
                {icons.plus}
                <span>New chat</span>
              </button>

              <div className="h-px bg-black/5 my-2" />

              {navItems.map((item) => {
                const active = pathname === item.href || (item.href !== '/chat' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      active ? 'bg-accent/8 text-accent font-medium' : 'text-text-secondary/70 hover:text-text-primary hover:bg-black/3'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>

            <div className="p-3 border-t border-black/5 space-y-1">
              {bottomItems.map((item) => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      active ? 'bg-accent/8 text-accent font-medium' : 'text-text-secondary/70 hover:text-text-primary hover:bg-black/3'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </aside>
        </>
      )}
    </>
  )
}
