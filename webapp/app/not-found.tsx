import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <img src="/images/logo.png" alt="" className="h-12 w-12 rounded-xl opacity-30 mb-6" />
      <h1 className="text-6xl font-bold text-text-primary/10 mb-2">404</h1>
      <p className="text-text-secondary/50 text-sm mb-6">This page could not be found.</p>
      <Link href="/chat" className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-accent-dark transition-colors">
        Go to chat
      </Link>
    </div>
  )
}
