'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

type SidebarContextType = {
  /** Desktop icon-rail visibility */
  isOpen: boolean
  /** Mobile drawer visibility */
  mobileOpen: boolean
  toggle: () => void
  toggleMobile: () => void
  closeMobile: () => void
  onNewChat: () => void
  setNewChatHandler: (handler: () => void) => void
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  mobileOpen: false,
  toggle: () => {},
  toggleMobile: () => {},
  closeMobile: () => {},
  onNewChat: () => {},
  setNewChatHandler: () => {},
})

export function useSidebar() {
  return useContext(SidebarContext)
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [newChatHandler, setHandler] = useState<() => void>(() => () => {})

  const toggle = useCallback(() => setIsOpen((v) => !v), [])
  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const setNewChatHandler = useCallback((handler: () => void) => {
    setHandler(() => handler)
  }, [])

  const onNewChat = useCallback(() => {
    newChatHandler()
  }, [newChatHandler])

  // Close mobile drawer on route change (handled by consuming components)
  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <SidebarContext.Provider value={{ isOpen, mobileOpen, toggle, toggleMobile, closeMobile, onNewChat, setNewChatHandler }}>
      {children}
    </SidebarContext.Provider>
  )
}
