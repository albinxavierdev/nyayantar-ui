import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4 animate-in">
      <Link href="/" className="text-sm text-text-secondary/50 hover:text-text-primary transition-colors inline-flex items-center gap-1 mb-6">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Home
      </Link>

      <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>

      <div className="prose prose-sm max-w-none text-text-secondary/70 space-y-4 text-[14px] leading-relaxed">
        <p>Bizfy Solutions (&quot;we&quot;) operates Nyayantar. This policy explains what data we collect and how we use it.</p>

        <h2 className="text-base font-semibold text-text-primary mt-6 mb-2">Data Collection</h2>
        <p>We collect your email, name, and queries you submit to the service. Conversations are stored to provide history and improve response quality.</p>

        <h2 className="text-base font-semibold text-text-primary mt-6 mb-2">Data Usage</h2>
        <p>Your data is used solely to provide and improve the Nyayantar service. We do not sell or share personal data with third parties.</p>

        <h2 className="text-base font-semibold text-text-primary mt-6 mb-2">Security</h2>
        <p>We use industry-standard measures to protect your data, including encryption at rest and in transit.</p>

        <h2 className="text-base font-semibold text-text-primary mt-6 mb-2">Contact</h2>
        <p>For privacy concerns, contact us at info@nyayantar.com.</p>
      </div>
    </div>
  )
}
