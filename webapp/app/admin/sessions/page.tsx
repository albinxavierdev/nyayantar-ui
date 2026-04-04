'use client'
import AdminShell from '@/components/shell/AdminShell'

const mockSessions = [
  { id: 'dad53...8ab8', user: 'user@nyayantar.com', createdAt: '2 hours ago', expiresAt: '7 days', agent: 'Chrome / Linux', status: 'active' },
  { id: 'f3ac1...72e4', user: 'admin@nyayantar.com', createdAt: '5 hours ago', expiresAt: '7 days', agent: 'Firefox / Mac', status: 'active' },
]

export default function AdminSessionsPage() {
  return (
    <AdminShell>
      <h1 className="text-lg font-semibold mb-0.5">Active Sessions</h1>
      <p className="text-sm text-text-secondary/50 mb-5">{mockSessions.length} active sessions</p>
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5">
              <th className="text-left px-4 py-2.5 font-medium text-text-secondary/50 text-[11px] uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-2.5 font-medium text-text-secondary/50 text-[11px] uppercase tracking-wider">Agent</th>
              <th className="text-left px-4 py-2.5 font-medium text-text-secondary/50 text-[11px] uppercase tracking-wider">Created</th>
              <th className="text-left px-4 py-2.5 font-medium text-text-secondary/50 text-[11px] uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockSessions.map((s) => (
              <tr key={s.id} className="border-b border-black/3 last:border-0 hover:bg-black/2 transition-colors">
                <td className="px-4 py-3 font-mono text-[12px]">{s.user}</td>
                <td className="px-4 py-3 text-text-secondary/60 text-[12px]">{s.agent}</td>
                <td className="px-4 py-3 text-text-secondary/60 text-[12px]">{s.createdAt}</td>
                <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/8 text-green-700/70 font-medium">{s.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  )
}
