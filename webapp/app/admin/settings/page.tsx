'use client'
import AdminShell from '@/components/shell/AdminShell'

export default function AdminSettingsPage() {
  return (
    <AdminShell>
      <h1 className="text-lg font-semibold mb-0.5">Admin Settings</h1>
      <p className="text-sm text-text-secondary/50 mb-5">System configuration</p>

      <div className="glass rounded-xl p-5 space-y-4">
        {[
          { label: 'Backend URL', value: 'http://127.0.0.1:8000' },
          { label: 'LLM Provider', value: 'Groq' },
          { label: 'Model', value: 'llama3-70b-8192' },
          { label: 'Max tokens', value: '2048' },
          { label: 'Temperature', value: '0.2' },
          { label: 'Database', value: 'SQLite (dev.db)' },
          { label: 'Index engine', value: 'SQLite FTS5' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-black/3 last:border-0">
            <span className="text-sm text-text-secondary/60">{item.label}</span>
            <span className="text-sm font-mono">{item.value}</span>
          </div>
        ))}
      </div>
    </AdminShell>
  )
}
