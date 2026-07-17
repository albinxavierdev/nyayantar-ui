import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";

export default function HelpPage() {
  return (
    <PageShell
      eyebrow="Help"
      title="How can we help you?"
      description="Find answers, explore guides, and get support for Nyayantar."
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
          <p className="text-sm font-medium text-accent1">Getting started</p>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            Learn how to set up your workspace, run your first research query, and review citations.
          </p>
          <Button href="#" variant="secondary" size="md" className="mt-4">
            Read guide
          </Button>
        </div>
        <div className="card-surface p-6">
          <p className="text-sm font-medium text-accent1">Account & billing</p>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            Manage your plan, update payment details, and review invoice history.
          </p>
          <Button href="/pricing" variant="secondary" size="md" className="mt-4">
            View plans
          </Button>
        </div>
        <div className="card-surface p-6">
          <p className="text-sm font-medium text-accent1">Contact support</p>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            Reach the team for account issues, bug reports, or feature requests.
          </p>
          <Button href="/feedback" variant="secondary" size="md" className="mt-4">
            Send feedback
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
