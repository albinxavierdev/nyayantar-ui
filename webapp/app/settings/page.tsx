'use client'

import AppShell from '@/components/shell/AppShell'
import { useState } from 'react'

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative h-5 w-9 rounded-full transition-colors ${value ? 'bg-accent' : 'bg-black/10'}`}
    >
      <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : ''}`} />
    </button>
  )
}

export default function SettingsPage() {
  const [language, setLanguage] = useState('auto')
  const [webSearch, setWebSearch] = useState(true)
  const [newsSearch, setNewsSearch] = useState(true)
  const [maxDocuments, setMaxDocuments] = useState(5)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <AppShell>
      <div className="max-w-xl mx-auto py-10 px-4 animate-in">
        <h1 className="text-xl font-semibold mb-0.5">Settings</h1>
        <p className="text-sm text-text-secondary/60 mb-8">Configure your Nyayantar experience</p>

        <div className="space-y-5">
          {/* Language */}
          <section className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold mb-3">Response Language</h2>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg border border-black/8 px-3 py-2 text-sm focus-ring bg-white/60"
            >
              <option value="auto">Auto-detect (match query language)</option>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="hinglish">Hinglish</option>
            </select>
            <p className="text-[11px] text-text-secondary/40 mt-2">Responses will match the language you ask in.</p>
          </section>

          {/* Search */}
          <section className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold mb-4">Search</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Web search</p>
                  <p className="text-[11px] text-text-secondary/50">Real-time legal web results</p>
                </div>
                <Toggle value={webSearch} onChange={setWebSearch} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">News search</p>
                  <p className="text-[11px] text-text-secondary/50">Latest legal news and judgment updates</p>
                </div>
                <Toggle value={newsSearch} onChange={setNewsSearch} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium">Max documents</p>
                  <span className="text-sm font-mono text-accent">{maxDocuments}</span>
                </div>
                <input type="range" min={1} max={10} value={maxDocuments} onChange={(e) => setMaxDocuments(Number(e.target.value))} className="w-full accent-accent" />
                <p className="text-[11px] text-text-secondary/40 mt-1">Local documents retrieved per query</p>
              </div>
            </div>
          </section>

          {/* API */}
          <section className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold mb-3">System</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-text-secondary/60">Backend</span>
                <span className="font-mono text-[12px]">localhost:8000</span>
              </div>
              <div className="border-t border-black/5" />
              <div className="flex items-center justify-between py-1.5">
                <span className="text-text-secondary/60">Model</span>
                <span className="font-mono text-[12px]">Groq / llama3</span>
              </div>
            </div>
          </section>

          <button
            onClick={handleSave}
            className="w-full bg-accent text-white rounded-xl py-2.5 text-sm font-medium hover:bg-accent-dark transition-colors"
          >
            {saved ? 'Saved' : 'Save settings'}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
