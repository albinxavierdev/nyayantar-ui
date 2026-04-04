'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setDone(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-in">
        <h1 className="text-2xl font-bold mb-1">New password</h1>
        <p className="text-sm text-text-secondary/60 mb-6">Choose a strong password for your account.</p>

        {done ? (
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-sm font-medium mb-2">Password updated</p>
            <Link href="/login" className="text-accent text-sm hover:underline">Go to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}
            <div>
              <label className="block text-sm font-medium mb-1.5">New password</label>
              <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} placeholder="Min. 6 characters" className="w-full rounded-lg border px-4 py-2.5 text-sm focus-ring bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Confirm password</label>
              <input type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError('') }} placeholder="Repeat password" className="w-full rounded-lg border px-4 py-2.5 text-sm focus-ring bg-white" />
            </div>
            <button type="submit" className="w-full bg-accent text-white rounded-lg py-2.5 text-sm font-medium hover:bg-accent-dark transition-colors">Update password</button>
          </form>
        )}
      </div>
    </div>
  )
}
