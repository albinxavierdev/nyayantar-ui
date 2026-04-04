'use client'
import AdminShell from '@/components/shell/AdminShell'
import { useState } from 'react'

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className={`relative h-5 w-9 rounded-full transition-colors ${value ? 'bg-accent' : 'bg-black/10'}`}>
      <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : ''}`} />
    </button>
  )
}

export default function AdminSearchControlsPage() {
  const [webSearch, setWebSearch] = useState(true)
  const [newsSearch, setNewsSearch] = useState(true)
  const [filterChinese, setFilterChinese] = useState(true)
  const [prioritizeIndian, setPrioritizeIndian] = useState(true)

  return (
    <AdminShell>
      <h1 className="text-lg font-semibold mb-0.5">Search Controls</h1>
      <p className="text-sm text-text-secondary/50 mb-5">Configure web search behavior</p>

      <div className="glass rounded-xl p-5 space-y-5">
        {[
          { label: 'Web search', desc: 'Real-time DuckDuckGo legal search', value: webSearch, set: setWebSearch },
          { label: 'News search', desc: 'Recent legal news and judgments', value: newsSearch, set: setNewsSearch },
          { label: 'Filter non-Indian domains', desc: 'Block .cn, .scmp, and other irrelevant sources', value: filterChinese, set: setFilterChinese },
          { label: 'Prioritize Indian sources', desc: 'Boost .gov.in, indiankanoon.org, livelaw.in', value: prioritizeIndian, set: setPrioritizeIndian },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-[11px] text-text-secondary/40">{item.desc}</p>
            </div>
            <Toggle value={item.value} onChange={item.set} />
          </div>
        ))}
      </div>
    </AdminShell>
  )
}
