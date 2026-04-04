'use client'
import AdminShell from '@/components/shell/AdminShell'
import { useState } from 'react'

const defaultPrompt = `You are Nyayantar, India's first Legal AI Agent, developed by Bizfy Solutions. You are a specialized legal research assistant focused exclusively on Indian law...`

export default function AdminPromptsPage() {
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <AdminShell>
      <h1 className="text-lg font-semibold mb-0.5">System Prompt</h1>
      <p className="text-sm text-text-secondary/50 mb-5">Edit the ASK agent system prompt</p>

      <div className="glass rounded-xl p-5">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={16}
          className="w-full bg-white/40 rounded-xl border border-black/5 p-4 text-sm font-mono leading-relaxed focus-ring resize-y"
        />
        <div className="flex items-center justify-between mt-4">
          <span className="text-[11px] text-text-secondary/40">{prompt.length} characters</span>
          <button onClick={handleSave} className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent-dark transition-colors">
            {saved ? 'Saved' : 'Save prompt'}
          </button>
        </div>
      </div>
    </AdminShell>
  )
}
