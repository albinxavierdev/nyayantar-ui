'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const adminNav = [
  { href: '/admin/sessions', label: 'Sessions' },
  { href: '/admin/logs', label: 'Logs' },
  { href: '/admin/index', label: 'Index' },
  { href: '/admin/search-controls', label: 'Search' },
  { href: '/admin/prompts', label: 'Prompts' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/health', label: 'Health' },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[rgb(var(--bg-primary))] via-[rgb(var(--bg-primary))] to-[rgb(var(--bg-tint)/0.05)]">
      <header className="glass-strong sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center h-12">
          <div className="flex items-center gap-3">
            <Link href="/chat" className="text-text-secondary/50 hover:text-text-primary transition-colors text-sm flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              App
            </Link>
            <span className="text-black/10">|</span>
            <div className="flex items-center gap-2">
              <img src="/images/logo.png" alt="" className="h-5 w-5 rounded" />
              <span className="font-semibold text-sm">Admin</span>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-0.5 overflow-x-auto pb-2 -mb-px">
            {adminNav.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${active ? 'bg-accent text-white' : 'text-text-secondary/50 hover:text-text-primary hover:bg-black/3'}`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-in">{children}</main>
    </div>
  )
}
