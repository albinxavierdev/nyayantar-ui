"use client";

import { PageShell } from "@/components/layout/PageShell";
import { PlansPanel } from "@/components/upgrade/PlansPanel";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";

export default function PricingPage() {
  const { loggedIn } = useAuth();

  return (
    <PageShell
      eyebrow="Pricing"
      title="Choose your plan."
      description="Start free, upgrade when you need more. Every plan includes core research and citation features."
      actions={
        !loggedIn ? (
          <Button href="/register" size="lg" showArrow>
            Create account
          </Button>
        ) : undefined
      }
    >
      <PlansPanel />
    </PageShell>
  );
}
