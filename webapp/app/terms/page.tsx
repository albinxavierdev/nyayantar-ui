import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";

const terms = [
  {
    title: "Acceptable use",
    copy:
      "Use the service lawfully and do not attempt to overload, abuse, or bypass the platform or its security controls.",
  },
  {
    title: "Account responsibility",
    copy:
      "You are responsible for access to your account and for keeping the email and authentication methods up to date.",
  },
  {
    title: "Content and outputs",
    copy:
      "Any drafts, summaries, or analysis created in the product should be reviewed before use in a live matter.",
  },
  {
    title: "Termination",
    copy:
      "We may suspend access for policy violations, abuse, or security concerns, and we may terminate inactive or risky accounts.",
  },
] as const;

export default function TermsPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Terms of Use"
      description="These terms cover the basic rules for using Nyayantar, including account responsibility, acceptable use, and how generated outputs should be treated."
      actions={
        <>
          <Button href="/privacy" variant="secondary" size="lg">
            Privacy policy
          </Button>
          <Button href="/feedback" size="lg" showArrow>
            Questions? Send feedback
          </Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {terms.map((term) => (
          <Reveal key={term.title} className="card-surface p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-accent1">
              <Icon name="scale" size={16} />
              {term.title}
            </div>
            <p className="mt-3 text-sm leading-6 text-text-muted">{term.copy}</p>
          </Reveal>
        ))}

        <Reveal className="card-surface p-6 lg:col-span-2">
          <div className="flex items-center gap-2 text-sm font-medium text-accent1">
            <Icon name="lock" size={16} />
            Final note
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-text-muted">
            The product is built to support professional workflows, but legal review
            and final judgment always remain with the user.
          </p>
        </Reveal>
      </div>
    </PageShell>
  );
}
