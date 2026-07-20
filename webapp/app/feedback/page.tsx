"use client";

import { PageShell } from "@/components/layout/PageShell";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";

export default function FeedbackPage() {
  const { loggedIn } = useAuth();

  return (
    <PageShell
      eyebrow="Support"
      title="Share feedback with the team."
      description="Use this page for product ideas, bug reports, policy requests, and anything that makes the experience feel clearer or more trustworthy."
      actions={
        !loggedIn ? (
          <Button href="/pricing" size="lg" showArrow>
            See plans
          </Button>
        ) : undefined
      }
    >
      <FeedbackForm />
    </PageShell>
  );
}
