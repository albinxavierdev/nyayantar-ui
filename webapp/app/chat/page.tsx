'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import AppShell from '@/components/shell/AppShell'
import Composer from '@/components/chat/Composer'
import MessageList from '@/components/chat/MessageList'
import { useSidebar } from '@/components/shell/SidebarContext'

type PhaseInfo = Record<string, unknown>
type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  meta?: PhaseInfo
  suggestions?: string[]
  isStreaming?: boolean
}

const heroSuggestions = [
  { text: 'What is Section 138 of the Negotiable Instruments Act?', sub: 'Legal provision' },
  { text: 'Latest Supreme Court judgments this week', sub: 'Recent updates' },
]

/** Generate 2 follow-up questions from the response content */
function generateFollowUps(query: string, response: string, meta?: PhaseInfo): string[] {
  const entities = (meta?.entities ?? []) as Array<{ text: string; label: string }>
  const suggestions: string[] = []

  // Extract legal references from response
  const sections = response.match(/Section\s+\d+[A-Za-z]*/g) || []
  const acts = response.match(/(?:the\s+)?[A-Z][a-zA-Z\s]+Act(?:,?\s+\d{4})?/g) || []

  // Suggestion 1: dig deeper into a mentioned provision
  if (sections.length > 0) {
    const sec = sections[0]
    suggestions.push(`What are the penalties under ${sec}?`)
  } else if (entities.length > 0) {
    suggestions.push(`Explain ${entities[0].text} in more detail`)
  } else {
    suggestions.push(`Can you explain this in simpler terms?`)
  }

  // Suggestion 2: related/practical question
  if (acts && acts.length > 0) {
    const act = acts[0]!.trim().replace(/^the\s+/i, '')
    suggestions.push(`What are recent amendments to the ${act}?`)
  } else if (query.toLowerCase().includes('judgment') || query.toLowerCase().includes('court')) {
    suggestions.push(`What is the legal significance of this ruling?`)
  } else {
    suggestions.push(`What are the landmark cases related to this?`)
  }

  return suggestions.slice(0, 2)
}

function ChatInner() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { setNewChatHandler } = useSidebar()

  // Register new-chat handler so sidebar button clears conversation in-app
  const resetChat = useCallback(() => {
    setMessages([])
    setLoading(false)
  }, [])

  useEffect(() => {
    setNewChatHandler(resetChat)
  }, [resetChat, setNewChatHandler])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = useCallback(async (text: string) => {
    const userMsgId = crypto.randomUUID()
    const assistantMsgId = crypto.randomUUID()
    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', content: text }])
    setLoading(true)

    // Add empty streaming assistant message
    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true },
    ])

    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000'
    let meta: PhaseInfo | undefined
    let fullContent = ''

    try {
      const res = await fetch(`${base}/query/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE events
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)

          try {
            const event = JSON.parse(payload)

            if (event.type === 'meta') {
              meta = event.data
            } else if (event.type === 'token') {
              fullContent += event.data
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: fullContent, isStreaming: true, meta }
                    : m
                )
              )
            } else if (event.type === 'done') {
              meta = event.data
            }
          } catch {
            // Ignore malformed JSON
          }
        }
      }

      // Finalize — generate suggestions
      const suggestions = generateFollowUps(text, fullContent, meta)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: fullContent || '(empty response)', isStreaming: false, meta, suggestions }
            : m
        )
      )
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Connection failed'

      // Fallback to non-streaming endpoint
      try {
        const fallbackRes = await fetch(`${base}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: text }),
        })
        if (fallbackRes.ok) {
          const data = await fallbackRes.json()
          const answer = data?.final_response ?? ''
          const phases = (data?.phases ?? []) as Array<Record<string, unknown>>
          const tagging = phases.find((p) => String(p.phase).includes('Tagging'))
          const agent = phases.find((p) => String(p.phase).includes('Agent'))
          const taggingOut = (tagging?.output ?? {}) as Record<string, unknown>
          const agentOut = (agent?.output ?? {}) as Record<string, unknown>
          const docRetrieval = (agentOut.document_retrieval ?? {}) as Record<string, unknown>
          const webSearch = (agentOut.web_search ?? {}) as Record<string, unknown>

          const fallbackMeta: Record<string, unknown> = {
            routed_agent: data?.routed_agent,
            entities: taggingOut.entities,
            documents: docRetrieval.sources,
            web_search_results: {
              web_count: webSearch.web_results_count ?? 0,
              news_count: webSearch.news_results_count ?? 0,
              sources: [...(webSearch.web_sources as string[] ?? []), ...(webSearch.news_sources as string[] ?? [])],
            },
            timing: {
              retrieval: docRetrieval.retrieval_time_seconds,
              web_search: webSearch.web_search_time_seconds,
              llm: docRetrieval.llm_generation_time_seconds,
              total: docRetrieval.total_agent_time_seconds,
            },
          }

          const suggestions = generateFollowUps(text, answer, fallbackMeta)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: answer || '(empty response)', isStreaming: false, meta: fallbackMeta, suggestions }
                : m
            )
          )
        } else {
          throw new Error('Fallback also failed')
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: `Connection error: ${msg}. Make sure the backend is running on port 8000.`, isStreaming: false }
              : m
          )
        )
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const hasMessages = messages.length > 0

  return (
      <div className="flex flex-col h-screen">
        <div className="flex-1 overflow-y-auto">
          {!hasMessages ? (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-4 animate-in">
              <div className="text-center mb-10">
                <img src="/images/logo.png" alt="Nyayantar" className="mx-auto mb-5 h-14 w-14 rounded-2xl shadow-lg" />
                <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight mb-2">How can I help you today?</h1>
                <p className="text-text-secondary/60 text-sm max-w-sm mx-auto leading-relaxed">
                  Ask any question about Indian law. I can search statutes, case law, recent judgments, and more.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-lg mb-8">
                {heroSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s.text)}
                    disabled={loading}
                    className="flex-1 text-left glass rounded-xl px-4 py-3.5 hover-lift group disabled:opacity-50 transition-all"
                  >
                    <p className="text-[13px] font-medium text-text-primary/80 group-hover:text-text-primary transition-colors leading-snug">{s.text}</p>
                    <p className="text-[11px] text-text-secondary/40 mt-1">{s.sub}</p>
                  </button>
                ))}
              </div>

              <div className="w-full max-w-xl">
                <Composer onSend={send} isLoading={loading} />
                <p className="text-[10px] text-text-secondary/30 text-center mt-3">
                  Nyayantar can make mistakes. For case-specific advice, consult a legal professional.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto py-6 px-4">
              <MessageList messages={messages} onFollowUp={send} />
              {loading && messages[messages.length - 1]?.content === '' && (
                <div className="flex justify-start mt-5">
                  <div className="glass-strong rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <img src="/images/logo.png" alt="" className="h-5 w-5 rounded-md" />
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent/50 typing-dot" />
                        <span className="h-1.5 w-1.5 rounded-full bg-accent/50 typing-dot" />
                        <span className="h-1.5 w-1.5 rounded-full bg-accent/50 typing-dot" />
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {hasMessages && (
          <div className="border-t border-black/5 px-4 py-3 glass-strong">
            <div className="max-w-2xl mx-auto">
              <Composer onSend={send} isLoading={loading} autoFocus={false} />
            </div>
          </div>
        )}
      </div>
  )
}

export default function ChatPage() {
  return (
    <AppShell>
      <ChatInner />
    </AppShell>
  )
}
