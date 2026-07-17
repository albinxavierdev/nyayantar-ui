import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <main className="page-bg flex min-h-[100dvh] flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-content text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-tint text-accent1">
          <Icon name="search" size={36} />
        </div>

        <p className="type-caption inline-flex items-center gap-2 rounded-full border border-border bg-surface-tint px-3 py-1 font-medium text-text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent2" />
          Page not found
        </p>

        <h1 className="mt-5 type-display-lg text-text md:type-display-xl">
          404
        </h1>

        <p className="mt-4 max-w-md mx-auto type-body text-text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back to something useful.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/" size="lg">
            Back to home
          </Button>
          <Button href="/chat" variant="secondary" size="lg">
            Open workspace
          </Button>
        </div>

        <div className="mt-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-text-muted framer-transition hover:text-text"
          >
            <Icon name="arrow" size={16} className="rotate-180" />
            Return to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
