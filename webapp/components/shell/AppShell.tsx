'use client'

import Sidebar from './Sidebar'
import { SidebarProvider, useSidebar } from './SidebarContext'

function ShellInner({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[rgb(var(--bg-primary))] via-[rgb(var(--bg-primary))] to-[rgb(var(--bg-tint)/0.08)]">
      <Sidebar />
      <main className={`min-h-screen transition-all duration-200 pt-12 md:pt-0 ${isOpen ? 'md:pl-[56px]' : 'md:pl-0'}`}>
        {children}
      </main>
    </div>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ShellInner>{children}</ShellInner>
    </SidebarProvider>
  )
}
