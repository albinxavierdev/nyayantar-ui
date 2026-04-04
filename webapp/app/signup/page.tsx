'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name || !email || !password) { setError('Please fill in all fields.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Signup failed')
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
          <h2 className="text-3xl font-bold mb-4">Join Nyayantar</h2>
          <p className="text-white/80 leading-relaxed">Get instant access to India&apos;s most comprehensive Legal AI Assistant. Research smarter, not harder.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <img src="/images/logo.png" alt="Nyayantar" className="h-8 w-8 rounded-lg" />
            <span className="font-semibold text-lg">Nyayantar</span>
          </Link>

          <h1 className="text-2xl font-bold mb-1">Create account</h1>
          <p className="text-text-secondary text-sm mb-6">Start your legal research journey</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus-ring bg-white"
              />
            </div>
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
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus-ring bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white rounded-lg py-2.5 text-sm font-medium hover:bg-accent-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link href="/login" className="text-accent font-medium hover:underline">Log in</Link>
          </p>

          <p className="mt-4 text-center text-xs text-text-secondary">
            By signing up, you agree to our{' '}
            <Link href="/legal/terms" className="underline">Terms</Link> and{' '}
            <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
