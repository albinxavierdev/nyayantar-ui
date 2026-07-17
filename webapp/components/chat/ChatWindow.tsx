import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { type Message } from "@/lib/constants";

export function Citation({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-border-gradient/40 bg-surface-tint px-2.5 py-1 text-xs font-medium text-accent1">
      <Icon name="doc" size={12} />
      {label}
    </span>
  );
}

export function ChatWindow() {
  return (
    <div className="card-surface flex h-[460px] overflow-hidden">
      {/* Conversation sidebar */}
      <aside className="hidden w-56 flex-col border-r border-border bg-surface-tint/40 md:flex">
        <div className="border-b border-border px-4 py-4">
          <p className="text-xs font-medium text-text-muted">Recent</p>
        </div>
        <div className="flex-1 space-y-1 p-2">
          <p className="px-3 py-2 text-sm text-text-muted">No threads yet</p>
        </div>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full primary-gradient text-xs font-semibold text-white">
              U
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-semibold text-text">User</p>
              <p className="truncate text-[11px] text-text-muted">Open chat to start</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main chat */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-tint text-accent1">
              <Icon name="brain" size={18} />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-text">
                Nyayantar Assistant
              </p>
              <p className="text-xs text-text-muted">Cite-checked · online</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-tint px-2.5 py-1 text-xs text-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent2" />
            SOC 2
          </span>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="flex h-full flex-col items-center justify-center gap-3 py-12">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-tint text-accent1">
              <Icon name="brain" size={22} />
            </span>
            <p className="text-sm text-text-muted">Start a conversation to begin research.</p>
          </div>
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
            <input
              type="text"
              placeholder="Ask about a case, clause, or citation…"
              className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-muted/60"
            />
            <button
              type="button"
              aria-label="Send message"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg primary-gradient text-white"
            >
              <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
