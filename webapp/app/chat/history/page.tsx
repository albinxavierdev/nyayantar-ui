'use client'

import AppShell from '@/components/shell/AppShell'
import { useSidebar } from '@/components/shell/SidebarContext'
import { useRouter } from 'next/navigation'

function HistoryInner() {
  const { onNewChat } = useSidebar()
  const router = useRouter()

  const handleNewChat = () => {
    onNewChat()
    router.push('/chat')
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">History</h1>
          <p className="text-sm text-text-secondary/60 mt-0.5">Your past conversations</p>
        </div>
        <button
          onClick={handleNewChat}
          className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          New chat
        </button>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-14 w-14 rounded-2xl glass flex items-center justify-center mb-5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-text-secondary/30">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h2 className="text-base font-medium mb-1.5">No conversations yet</h2>
        <p className="text-sm text-text-secondary/50 max-w-xs leading-relaxed mb-6">
          Start a new chat to ask any question about Indian law. Your conversations will appear here.
        </p>
        <button
          onClick={handleNewChat}
          className="text-sm text-accent font-medium hover:underline transition-colors"
        >
          Start your first conversation
        </button>
      </div>
    </div>
  )
}

export default function ChatHistoryPage() {
  return (
    <AppShell>
      <HistoryInner />
    </AppShell>
  )
}
