'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-gradient-to-br from-[rgb(var(--bg-primary))] via-[rgb(var(--bg-primary))] to-[rgb(var(--bg-tint)/0.08)]">
      <div className="animate-in">
        <div className="h-16 w-16 rounded-2xl glass flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-text-secondary/40">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold mb-2">You&apos;re offline</h1>
        <p className="text-sm text-text-secondary/50 max-w-xs mx-auto leading-relaxed mb-6">
          Nyayantar needs an internet connection to search legal documents and generate responses. Please check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
