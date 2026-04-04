'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (email) setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-in">
        <Link href="/login" className="text-sm text-text-secondary/50 hover:text-text-primary transition-colors inline-flex items-center gap-1 mb-6">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to login
        </Link>

        <h1 className="text-2xl font-bold mb-1">Reset password</h1>
        <p className="text-sm text-text-secondary/60 mb-6">Enter your email and we will send you a reset link.</p>

        {sent ? (
          <div className="glass rounded-2xl p-6 text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(34,197,94)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="text-sm font-medium mb-1">Email sent</p>
            <p className="text-[12px] text-text-secondary/50">Check your inbox for a reset link.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-lg border px-4 py-2.5 text-sm focus-ring bg-white" />
            </div>
            <button type="submit" className="w-full bg-accent text-white rounded-lg py-2.5 text-sm font-medium hover:bg-accent-dark transition-colors">Send reset link</button>
          </form>
        )}
      </div>
    </div>
  )
}
