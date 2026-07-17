import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";

const sections: { title: string; copy: string; id?: string }[] = [
  {
    title: "Information we collect",
    copy:
      "We collect the account details you provide, workspace content you upload, and basic product usage data needed to keep the service reliable.",
  },
  {
    title: "How we use it",
    copy:
      "Information is used to provide the product, secure accounts, improve workflows, and respond to feedback or support requests.",
  },
  {
    title: "Your controls",
    copy:
      "You can update your profile, request data exports, and ask us to remove data according to the account and retention settings in your plan.",
  },
  {
    title: "Cookies and analytics",
    copy:
      "We use essential cookies for authentication and session state, plus limited analytics to understand product performance and reliability.",
    id: "cookies",
  },
] as const;

export default function PrivacyPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Privacy Policy"
      description="This page explains how Nyayantar handles account data, workspace content, and site analytics. It is written to be clear, practical, and easy to review."
      actions={
        <>
          <Button href="/terms" variant="secondary" size="lg">
            Terms of use
          </Button>
          <Button href="/security" size="lg" showArrow>
            Security
          </Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {sections.map((section) => (
          <Reveal key={section.title} className="card-surface p-6">
            <div
              id={section.id}
              className="flex items-center gap-2 text-sm font-medium text-accent1"
            >
              <Icon name="shield" size={16} />
              {section.title}
            </div>
            <p className="mt-3 text-sm leading-6 text-text-muted">{section.copy}</p>
          </Reveal>
        ))}

        <Reveal className="card-surface p-6 lg:col-span-2">
          <div className="flex items-center gap-2 text-sm font-medium text-accent1">
            <Icon name="doc" size={16} />
            Contact and updates
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-text-muted">
            If you need a copy of this policy in another format or want to ask a
            question about data handling, reach out through feedback and the request
            will be routed to the right team.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button href="/cookies" size="md" showArrow>
              Cookie policy
            </Button>
            <Button href="/" variant="secondary" size="md">
              Back to home
            </Button>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
