'use client'
import AdminShell from '@/components/shell/AdminShell'

const mockLogs = [
  { id: '1', actorEmail: 'admin@nyayantar.com', action: 'login', target: null, createdAt: '2 min ago' },
  { id: '2', actorEmail: 'user@nyayantar.com', action: 'query', target: 'Section 138 NI Act', createdAt: '15 min ago' },
  { id: '3', actorEmail: 'admin@nyayantar.com', action: 'settings.update', target: 'web_search=true', createdAt: '1 hour ago' },
  { id: '4', actorEmail: 'user@nyayantar.com', action: 'login', target: null, createdAt: '3 hours ago' },
]

export default function AdminLogsPage() {
  return (
    <AdminShell>
      <h1 className="text-lg font-semibold mb-0.5">Audit Logs</h1>
      <p className="text-sm text-text-secondary/50 mb-5">Recent activity across all users</p>
      <div className="space-y-1.5">
        {mockLogs.map((log) => (
          <div key={log.id} className="glass rounded-xl px-4 py-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-text-secondary/40">{log.createdAt}</span>
              <span className="text-[12px]">{log.actorEmail}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-md glass-dark font-medium">{log.action}</span>
              {log.target && <span className="text-[11px] text-text-secondary/50 truncate max-w-[200px]">{log.target}</span>}
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  )
}
