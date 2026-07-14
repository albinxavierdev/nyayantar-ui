"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { initialMessages, initialThreads, type Message } from "@/lib/constants";
import { sanitizeText } from "@/lib/utils";

export function ChatApp() {
  const [threads] = useState(initialThreads);
  const [activeThread, setActiveThread] = useState("t1");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (sidebarOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [sidebarOpen]);

  const send = useCallback(() => {
    const text = sanitizeText(draft);
    if (!text) return;
    const nextId = messages.length + 1;
    setMessages((m) => [...m, { id: nextId, role: "user", text }]);
    setDraft("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: m.length + 1,
          role: "assistant",
          text: "That's a strong angle. I'll trace the key holding to its source and surface any conflicting precedent so your memo stays defensible.",
          citations: ["Cite-check pending"],
        },
      ]);
    }, 600);
  }, [draft, messages.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    },
    [send]
  );

  return (
    <div className="flex h-[100dvh] min-h-0 w-full bg-page">
      {/* Sidebar (desktop + drawer on mobile) */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-surface-tint/40 transition-transform duration-300 lg:static lg:translate-x-0`}
        aria-label="Chat sidebar"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <span className="flex items-center gap-2">
            <Logo />
            <span className="text-base font-semibold tracking-tight-2">
              Nyayantar
            </span>
          </span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text lg:hidden"
            aria-label="Close sidebar"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="p-3">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text framer-transition hover:border-text/30"
          >
            <Icon name="spark" size={16} className="text-accent1" />
            New research
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Chat threads">
          {threads.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveThread(t.id);
                setSidebarOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm framer-transition ${
                t.id === activeThread
                  ? "bg-surface text-text shadow-[0_4px_14px_rgba(141,75,44,0.08)]"
                  : "text-text-muted hover:bg-surface hover:text-text"
              }`}
              aria-current={t.id === activeThread ? "true" : undefined}
            >
              <Icon
                name="search"
                size={15}
                className={t.id === activeThread ? "text-accent1" : ""}
              />
              <span className="truncate">{t.title}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <a
            href="/"
            className="flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2 text-sm font-medium text-text-muted framer-transition hover:text-text"
          >
            <Icon name="arrow" size={16} className="rotate-180" />
            Back to site
          </a>
          <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2">
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

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
        />
      )}

      {/* Main chat column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text lg:hidden"
              aria-label="Open sidebar"
            >
              <Icon name="menu" size={18} />
            </button>
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
        </header>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6" role="log" aria-label="Chat messages" aria-live="polite">
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-surface-tint px-4 py-2.5 text-sm leading-6 text-text md:max-w-[70%]">
                  {m.text}
                </p>
              </div>
            ) : (
              <div key={m.id} className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full primary-gradient text-xs font-semibold text-white">
                  N
                </span>
                <div className="max-w-[85%] md:max-w-[70%]">
                  <p className="rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-2.5 text-sm leading-6 text-text">
                    {m.text}
                  </p>
                  {m.citations && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {m.citations.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1.5 rounded-full border border-accent-border-gradient/40 bg-surface-tint px-2.5 py-1 text-xs font-medium text-accent1"
                        >
                          <Icon name="doc" size={12} />
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-surface/80 p-3 backdrop-blur-md md:p-4">
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border bg-surface px-3 py-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about a case, clause, or citation…"
              aria-label="Chat message input"
              className="min-w-0 flex-1 resize-none bg-transparent py-1.5 text-sm text-text outline-none placeholder:text-text-muted/60"
            />
            <button
              type="button"
              onClick={send}
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
