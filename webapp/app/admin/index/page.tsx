'use client'
import AdminShell from '@/components/shell/AdminShell'

export default function AdminIndexPage() {
  return (
    <AdminShell>
      <h1 className="text-lg font-semibold mb-0.5">Document Index</h1>
      <p className="text-sm text-text-secondary/50 mb-5">Manage the local document index</p>

      <div className="grid sm:grid-cols-3 gap-2.5 mb-6">
        {[
          { label: 'Documents', value: '72' },
          { label: 'Pages indexed', value: '4,800+' },
          { label: 'Index size', value: '18 MB' },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-semibold">{s.value}</p>
            <p className="text-[11px] text-text-secondary/50 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2.5">
        <button className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent-dark transition-colors">Rebuild index</button>
        <button className="glass px-4 py-2 rounded-xl text-sm font-medium hover-lift transition-all">Clear cache</button>
      </div>
    </AdminShell>
  )
}
