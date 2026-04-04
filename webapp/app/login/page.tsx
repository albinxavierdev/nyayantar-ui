'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid credentials')
        setLoading(false)
        return
      }

      sessionStorage.setItem('ny_user', JSON.stringify(data.user))
      sessionStorage.setItem('ny_session', data.sessionId)
      router.push('/chat')
    } catch {
      setError('Connection failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-accent items-center justify-center p-12">
        <div className="max-w-md text-white">
          <img src="/images/logo.png" alt="Nyayantar" className="h-14 w-14 rounded-xl mb-8 bg-white/20 p-1" />
          <h2 className="text-3xl font-bold mb-4">Welcome back to Nyayantar</h2>
          <p className="text-white/80 leading-relaxed">India&apos;s first Legal AI Agent. Get instant answers to your legal questions in English, Hindi, or Hinglish.</p>
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-sm text-white/70">
              <span className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
              72+ indexed legal documents
            </div>
            <div className="flex items-center gap-3 text-sm text-white/70">
              <span className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
              Real-time legal news and judgments
            </div>
            <div className="flex items-center gap-3 text-sm text-white/70">
              <span className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
              Multilingual support
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <img src="/images/logo.png" alt="Nyayantar" className="h-8 w-8 rounded-lg" />
            <span className="font-semibold text-lg">Nyayantar</span>
          </Link>

          <h1 className="text-2xl font-bold mb-1">Log in</h1>
          <p className="text-text-secondary text-sm mb-6">Enter your credentials to access Nyayantar</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus-ring bg-white"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium">Password</label>
                <Link href="/forgot-password" className="text-xs text-accent hover:underline">Forgot password?</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus-ring bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white rounded-lg py-2.5 text-sm font-medium hover:bg-accent-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-accent font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
