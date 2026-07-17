import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";

export default function PricingPage() {
  return (
    <PageShell
      eyebrow="Pricing"
      title="Upgrade your plan."
      description="Choose the right plan for your practice. All plans include core research and citation features."
      actions={
        <>
          <Button href="/login" variant="secondary" size="lg">
            Sign in
          </Button>
          <Button href="/register" size="lg" showArrow>
            Create account
          </Button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <div className="card-surface p-6">
          <p className="text-sm font-medium text-accent1">Starter</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight-2 text-text">
            Free
          </p>
          <p className="mt-1 text-sm text-text-muted">For individuals exploring the workspace.</p>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            <li className="flex gap-2">
              <span className="text-accent1">✓</span>
              10 research queries / day
            </li>
            <li className="flex gap-2">
              <span className="text-accent1">✓</span>
              Basic citations
            </li>
            <li className="flex gap-2">
              <span className="text-accent1">✓</span>
              Community support
            </li>
          </ul>
          <Button href="/register" variant="secondary" size="md" className="mt-5 w-full">
            Get started
          </Button>
        </div>
        <div className="card-surface p-6">
          <p className="text-sm font-medium text-accent1">Professional</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight-2 text-text">
            $29<span className="text-base font-medium text-text-muted">/mo</span>
          </p>
          <p className="mt-1 text-sm text-text-muted">For lawyers who need deeper research.</p>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            <li className="flex gap-2">
              <span className="text-accent1">✓</span>
              Unlimited queries
            </li>
            <li className="flex gap-2">
              <span className="text-accent1">✓</span>
              Advanced citations + sources
            </li>
            <li className="flex gap-2">
              <span className="text-accent1">✓</span>
              Priority support
            </li>
          </ul>
          <Button href="/register" size="md" showArrow className="mt-5 w-full">
            Start free trial
          </Button>
        </div>
        <div className="card-surface p-6">
          <p className="text-sm font-medium text-accent1">Firm</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight-2 text-text">
            Custom
          </p>
          <p className="mt-1 text-sm text-text-muted">For teams and organizations.</p>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            <li className="flex gap-2">
              <span className="text-accent1">✓</span>
              Everything in Professional
            </li>
            <li className="flex gap-2">
              <span className="text-accent1">✓</span>
              Admin controls + audit log
            </li>
            <li className="flex gap-2">
              <span className="text-accent1">✓</span>
              Dedicated onboarding
            </li>
          </ul>
          <Button href="/feedback" variant="secondary" size="md" className="mt-5 w-full">
            Contact sales
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
