import { PageShell } from "@/components/layout/PageShell";
import { ContactForm } from "@/components/contact/ContactForm";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";

const routes = [
  {
    title: "Product feedback",
    copy: "Share feature ideas, workflow issues, and UI suggestions.",
    href: "/feedback",
  },
  {
    title: "Privacy and data",
    copy: "Review the privacy policy or ask a data-handling question.",
    href: "/privacy",
  },
  {
    title: "Security and admin",
    copy: "Escalate an access concern or review platform controls.",
    href: "/security",
  },
] as const;

export default function ContactPage() {
  return (
    <PageShell
      eyebrow="Support"
      title="Contact and support routing."
      description="Use this page when you need to reach the right path quickly. It keeps support, privacy, security, and feedback organized without changing the site's brand feel."
      actions={
        <>
          <Button href="/feedback" variant="secondary" size="lg">
            Feedback
          </Button>
          <Button href="/login" size="lg" showArrow>
            Sign in
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <ContactForm />

        <div className="space-y-5">
          <Reveal className="card-surface p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-accent1">
              <Icon name="spark" size={16} />
              Best route
            </div>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              Pick the route that matches your request so it reaches the right
              people faster.
            </p>
          </Reveal>

          {routes.map((route) => (
            <Reveal key={route.title} className="card-surface p-6">
              <h2 className="text-base font-semibold tracking-tight-2 text-text">
                {route.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-muted">{route.copy}</p>
              <div className="mt-4">
                <Button href={route.href} variant="secondary" size="md" showArrow className="w-full">
                  Open page
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
