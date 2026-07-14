import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { chatThreads, initialMessages } from "@/lib/constants";

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
          {chatThreads.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm framer-transition ${
                t.active
                  ? "bg-surface text-text shadow-[0_4px_14px_rgba(141,75,44,0.08)]"
                  : "text-text-muted hover:bg-surface hover:text-text"
              }`}
            >
              <Icon
                name="search"
                size={15}
                className={t.active ? "text-accent1" : ""}
              />
              <span className="truncate">{t.title}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full primary-gradient text-xs font-semibold text-white">
              AR
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-semibold text-text">
                Ananya Rao
              </p>
              <p className="truncate text-[11px] text-text-muted">Meridian Law</p>
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
          {initialMessages.map((m, idx) => {
            if (m.role === "user") {
              return (
                <div key={idx} className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-surface-tint px-4 py-2.5 text-sm leading-6 text-text">
                    {m.text}
                  </p>
                </div>
              );
            }
            return (
              <div key={idx} className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full primary-gradient text-xs font-semibold text-white">
                  N
                </span>
                <div className="max-w-[85%]">
                  <p className="rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-2.5 text-sm leading-6 text-text">
                    {m.text}
                  </p>
                  {m.citations && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {m.citations.map((c) => (
                        <Citation key={c} label={c} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
