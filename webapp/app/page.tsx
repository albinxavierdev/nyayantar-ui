import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="glass-strong fixed top-0 inset-x-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/images/logo.png" alt="Nyayantar" className="h-8 w-8 rounded-lg" />
            <span className="font-semibold tracking-tight">Nyayantar</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-text-secondary/60 hover:text-text-primary transition-colors">Log in</Link>
            <Link href="/signup" className="bg-accent text-white text-sm px-4 py-2 rounded-xl hover:bg-accent-dark transition-colors font-medium">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-24 pb-20">
        <div className="animate-in">
          <img src="/images/logo.png" alt="" className="h-16 w-16 rounded-2xl mx-auto mb-6 shadow-lg" />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 leading-tight">
            India&apos;s first<br /><span className="gradient-text">Legal AI Agent</span>
          </h1>
          <p className="text-text-secondary/60 text-lg max-w-md mx-auto mb-8 leading-relaxed">
            Instant answers on Indian law. Research statutes, case law, and recent judgments in English, Hindi, or Hinglish.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/chat" className="bg-accent text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-accent-dark transition-colors shadow-lg shadow-accent/15">
              Start chatting
            </Link>
            <Link href="/login" className="glass px-6 py-3 rounded-xl text-sm font-medium hover-lift transition-all">
              Log in
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-sm mx-auto">
          {[
            { value: '72+', label: 'Legal documents' },
            { value: '4.8K', label: 'Pages indexed' },
            { value: '3', label: 'Languages' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold gradient-text">{stat.value}</p>
              <p className="text-[11px] text-text-secondary/40 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[11px] text-text-secondary/30">
        <p>Nyayantar by Bizfy Solutions &middot; info@nyayantar.com</p>
        <div className="mt-1 flex items-center justify-center gap-3">
          <Link href="/legal/terms" className="hover:text-text-primary transition-colors">Terms</Link>
          <Link href="/legal/privacy" className="hover:text-text-primary transition-colors">Privacy</Link>
        </div>
      </footer>
    </div>
  )
}
