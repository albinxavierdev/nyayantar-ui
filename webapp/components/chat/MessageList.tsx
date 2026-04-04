'use client'

import { useState } from 'react'

type PhaseInfo = Record<string, unknown>

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  meta?: PhaseInfo
  suggestions?: string[]
  isStreaming?: boolean
}

/* ── Format response text into structured JSX ── */
function FormattedResponse({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  lines.forEach((line, i) => {
    const trimmed = line.trim()

    if (/^[\-\*•]\s/.test(trimmed)) {
      const content = trimmed.replace(/^[\-\*•]\s+/, '')
      elements.push(
        <div key={i} className="flex gap-2 py-0.5">
          <span className="text-accent/50 mt-0.5 shrink-0">&#8226;</span>
          <span>{formatInline(content)}</span>
        </div>
      )
    } else if (/^\d+[\.\)]\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)[\.\)]\s/)?.[1] ?? ''
      const content = trimmed.replace(/^\d+[\.\)]\s+/, '')
      elements.push(
        <div key={i} className="flex gap-2.5 py-0.5">
          <span className="text-accent/60 font-medium tabular-nums shrink-0 w-4 text-right">{num}.</span>
          <span>{formatInline(content)}</span>
        </div>
      )
    } else if (trimmed === '') {
      elements.push(<div key={i} className="h-2" />)
    } else {
      elements.push(<p key={i} className="py-0.5">{formatInline(trimmed)}</p>)
    }
  })

  return <div className="space-y-0.5">{elements}</div>
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    const highlighted = part.replace(
      /(Section\s+\d+[A-Za-z]*|Article\s+\d+[A-Za-z]*|Act,?\s+\d{4})/g,
      '§$1§'
    )
    if (highlighted.includes('§')) {
      return highlighted.split('§').map((seg, j) =>
        /^(Section\s+\d|Article\s+\d|Act,?\s+\d)/.test(seg)
          ? <span key={`${i}-${j}`} className="font-medium text-accent/80">{seg}</span>
          : <span key={`${i}-${j}`}>{seg}</span>
      )
    }
    return part
  })
}

/* ── Chevron ── */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
  )
}

/* ── Citations dropdown ── */
function CitationsDropdown({ meta }: { meta: PhaseInfo }) {
  const [open, setOpen] = useState(false)

  const documents = (meta.documents ?? []) as Array<Record<string, string | number>>
  const webResults = (meta.web_search_results ?? {}) as Record<string, unknown>
  const webSources = (webResults.sources ?? []) as string[]
  const timing = meta.timing as Record<string, number> | undefined

  // Deduplicate docs
  const seen = new Set<string>()
  const uniqueDocs = documents.filter((d) => {
    const key = `${d.filename}-${d.page}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const totalSources = uniqueDocs.length + webSources.length
  if (totalSources === 0 && !timing?.total) return null

  return (
    <div className="mt-3 pt-2.5 border-t border-black/5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-text-secondary/50 hover:text-text-primary transition-colors group w-full"
      >
        <Chevron open={open} />
        <div className="flex items-center gap-2 text-[11px]">
          {totalSources > 0 && (
            <span className="font-medium">{totalSources} citation{totalSources !== 1 ? 's' : ''}</span>
          )}
          {timing?.total != null && (
            <span className="text-text-secondary/30 font-mono">{timing.total.toFixed(2)}s</span>
          )}
        </div>
      </button>

      {open && (
        <div className="mt-2.5 space-y-2 animate-in">
          {/* Document citations */}
          {uniqueDocs.length > 0 && (
            <div>
              <p className="text-[10px] text-text-secondary/40 uppercase tracking-wider font-medium mb-1.5">Documents</p>
              <div className="space-y-1">
                {uniqueDocs.map((d, i) => {
                  const title = d.subcategory || d.category || d.filename
                  return (
                    <div key={i} className="flex items-center gap-2.5 rounded-lg glass-dark px-3 py-2 text-[11px]">
                      <svg className="h-3.5 w-3.5 text-accent/40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <span className="font-medium truncate flex-1">{title}</span>
                      {d.page && <span className="text-text-secondary/30 shrink-0">p.{d.page}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Web sources */}
          {webSources.length > 0 && (
            <div>
              <p className="text-[10px] text-text-secondary/40 uppercase tracking-wider font-medium mb-1.5">Web</p>
              <div className="space-y-1">
                {webSources.slice(0, 5).map((src, i) => {
                  let domain = src
                  try { domain = new URL(src).hostname.replace('www.', '') } catch { /* keep */ }
                  return (
                    <a
                      key={i}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 rounded-lg glass-dark px-3 py-2 text-[11px] hover:bg-accent/5 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5 text-accent/40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      <span className="font-medium truncate">{domain}</span>
                      <svg className="h-3 w-3 text-text-secondary/20 shrink-0 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* Timing */}
          {timing && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-text-secondary/30 font-mono pt-1">
              {timing.retrieval != null && timing.retrieval > 0 && <span>index {timing.retrieval.toFixed(2)}s</span>}
              {timing.web_search != null && timing.web_search > 0 && <span>web {timing.web_search.toFixed(2)}s</span>}
              {timing.llm != null && timing.llm > 0 && <span>llm {timing.llm.toFixed(2)}s</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Follow-up suggestions ── */
function FollowUpSuggestions({ suggestions, onSelect }: { suggestions: string[]; onSelect: (q: string) => void }) {
  if (!suggestions || suggestions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => onSelect(s)}
          className="text-left text-[12px] leading-snug glass rounded-xl px-3.5 py-2.5 hover-lift group transition-all max-w-[280px]"
        >
          <span className="text-text-primary/70 group-hover:text-accent transition-colors">{s}</span>
        </button>
      ))}
    </div>
  )
}

/* ── Typing indicator ── */
function StreamingCursor() {
  return <span className="inline-block w-0.5 h-4 bg-accent/60 animate-pulse ml-0.5 align-text-bottom" />
}

export default function MessageList({ messages, onFollowUp }: { messages: Message[]; onFollowUp?: (q: string) => void }) {
  if (messages.length === 0) return null

  return (
    <div className="space-y-5 animate-in">
      {messages.map((m, idx) => (
        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[88%] sm:max-w-[75%] ${
            m.role === 'user'
              ? 'bg-accent text-white rounded-2xl rounded-br-md px-4 py-3'
              : 'rounded-2xl rounded-bl-md px-4 py-3.5 glass-strong'
          }`}>
            {m.role === 'assistant' && (
              <div className="flex items-center gap-2 mb-2.5">
                <img src="/images/logo.png" alt="" className="h-5 w-5 rounded-md" />
                <span className="text-[11px] font-semibold text-accent/80 tracking-wide uppercase">Nyayantar</span>
              </div>
            )}
            {m.role === 'user' ? (
              <div className="text-[14px] leading-[1.7] whitespace-pre-wrap">{m.content}</div>
            ) : (
              <div className="text-[14px] leading-[1.75] text-text-primary/90">
                {m.content ? <FormattedResponse text={m.content} /> : null}
                {m.isStreaming && m.content ? <StreamingCursor /> : null}
              </div>
            )}
            {m.role === 'assistant' && !m.isStreaming && m.meta && <CitationsDropdown meta={m.meta} />}
            {m.role === 'assistant' && !m.isStreaming && m.suggestions && onFollowUp && idx === messages.length - 1 && (
              <FollowUpSuggestions suggestions={m.suggestions} onSelect={onFollowUp} />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
