'use client'

import AppShell from '@/components/shell/AppShell'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

type UserInfo = { name: string; email: string; role: string }

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('ny_user')
    if (stored) {
      const u = JSON.parse(stored) as UserInfo
      setUser(u)
      setName(u.name)
    }
  }, [])

  function handleSave() {
    if (user) {
      const updated = { ...user, name }
      sessionStorage.setItem('ny_user', JSON.stringify(updated))
      setUser(updated)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleLogout() {
    sessionStorage.removeItem('ny_user')
    sessionStorage.removeItem('ny_session')
    router.push('/login')
  }

  return (
    <AppShell>
      <div className="max-w-xl mx-auto py-10 px-4 animate-in">
        <h1 className="text-xl font-semibold mb-0.5">Profile</h1>
        <p className="text-sm text-text-secondary/60 mb-8">Manage your account</p>

        <div className="space-y-5">
          {/* Avatar card */}
          <section className="glass rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center">
                <img src="/images/logo.png" alt="" className="h-8 w-8 rounded-md opacity-80" />
              </div>
              <div>
                <h2 className="font-semibold">{user?.name || 'User'}</h2>
                <p className="text-sm text-text-secondary/60">{user?.email || 'No email'}</p>
                <span className="inline-flex mt-1 text-[10px] px-2 py-0.5 rounded-full bg-accent/8 text-accent font-medium capitalize">{user?.role?.toLowerCase() || 'user'}</span>
              </div>
            </div>
          </section>

          {/* Edit */}
          <section className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold mb-3">Edit profile</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-medium text-text-secondary/60 uppercase tracking-wide">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-black/8 px-3 py-2 text-sm mt-1 focus-ring bg-white/60"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-text-secondary/60 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  className="w-full rounded-lg border border-black/5 px-3 py-2 text-sm mt-1 bg-black/3 text-text-secondary/60 cursor-not-allowed"
                  readOnly
                />
              </div>
              <button
                onClick={handleSave}
                className="bg-accent text-white rounded-xl px-5 py-2 text-sm font-medium hover:bg-accent-dark transition-colors"
              >
                {saved ? 'Saved' : 'Save changes'}
              </button>
            </div>
          </section>

          {/* Account */}
          <section className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold mb-3">Account</h2>
            <div className="space-y-2">
              <Link href="/reset-password" className="block text-sm text-accent hover:underline">Change password</Link>
              <button onClick={handleLogout} className="text-sm text-red-500/80 hover:text-red-600 hover:underline transition-colors">Log out</button>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
