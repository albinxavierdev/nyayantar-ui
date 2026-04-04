'use client'

import { useState, useRef, useEffect } from 'react'

type Props = {
  onSend: (text: string) => Promise<void> | void
  isLoading?: boolean
  placeholder?: string
  autoFocus?: boolean
}

export default function Composer({ onSend, isLoading, placeholder, autoFocus = true }: Props) {
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])

  /* Auto-resize textarea */
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 180) + 'px'
  }, [text])

  async function handleSubmit() {
    const value = text.trim()
    if (!value || isLoading) return
    setText('')
    if (ref.current) ref.current.style.height = 'auto'
    await onSend(value)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <div className="glass-strong rounded-2xl shadow-lg transition-shadow focus-within:shadow-xl">
      <textarea
        ref={ref}
        className="w-full resize-none bg-transparent px-5 pt-4 pb-1 outline-none text-[15px] leading-relaxed placeholder:text-text-secondary/50"
        placeholder={placeholder || 'Ask anything about Indian law...'}
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={isLoading}
      />
      <div className="flex items-center justify-between px-4 pb-3 pt-1">
        <span className="text-[11px] text-text-secondary/50 select-none">
          English, Hindi & Hinglish
        </span>
        <button
          onClick={handleSubmit}
          disabled={isLoading || !text.trim()}
          className="flex items-center justify-center h-8 w-8 rounded-lg bg-accent text-white transition-all hover:bg-accent-dark disabled:opacity-30 disabled:hover:bg-accent"
          aria-label="Send"
        >
          {isLoading ? (
            <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          )}
        </button>
      </div>
    </div>
  )
}
