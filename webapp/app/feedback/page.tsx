import { PageShell } from "@/components/layout/PageShell";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { Button } from "@/components/ui/Button";

export default function FeedbackPage() {
  return (
    <PageShell
      eyebrow="Support"
      title="Share feedback with the team."
      description="Use this page for product ideas, bug reports, policy requests, and anything that makes the experience feel clearer or more trustworthy."
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
      <FeedbackForm />
    </PageShell>
  );
}
