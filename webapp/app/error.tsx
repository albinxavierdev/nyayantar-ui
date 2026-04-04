'use client'

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <img src="/images/logo.png" alt="" className="h-12 w-12 rounded-xl opacity-30 mb-6" />
      <h1 className="text-xl font-semibold mb-1">Something went wrong</h1>
      <p className="text-text-secondary/50 text-sm mb-6 max-w-sm">{error.message || 'An unexpected error occurred.'}</p>
      <button onClick={reset} className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-accent-dark transition-colors">
        Try again
      </button>
    </div>
  )
}
