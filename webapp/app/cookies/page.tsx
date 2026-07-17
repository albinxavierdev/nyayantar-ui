import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";

const cookieTypes = [
  {
    title: "Strictly necessary",
    copy:
      "These cookies are needed for sign-in, session state, and core site behavior. They cannot be turned off without breaking the app.",
  },
  {
    title: "Preferences",
    copy:
      "These remember display choices and lightweight interface settings so the site feels consistent between visits.",
  },
  {
    title: "Analytics",
    copy:
      "Analytics cookies help us understand page performance, navigation patterns, and where people may be getting stuck.",
  },
  {
    title: "Support routing",
    copy:
      "Support cookies are only used when needed to preserve form state or route a request across a page transition.",
  },
] as const;

export default function CookiesPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Cookie policy"
      description="This policy explains how the site uses cookies and similar technologies to keep sessions working and the product experience clear."
      actions={
        <>
          <Button href="/privacy" variant="secondary" size="lg">
            Privacy policy
          </Button>
          <Button href="/contact" size="lg" showArrow>
            Contact support
          </Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {cookieTypes.map((cookie) => (
          <Reveal key={cookie.title} className="card-surface p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-accent1">
              <Icon name="doc" size={16} />
              {cookie.title}
            </div>
            <p className="mt-3 text-sm leading-6 text-text-muted">{cookie.copy}</p>
          </Reveal>
        ))}

        <Reveal className="card-surface p-6 lg:col-span-2">
          <div className="flex items-center gap-2 text-sm font-medium text-accent1">
            <Icon name="check" size={16} />
            Cookie controls
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-text-muted">
            You can adjust browser-level cookie settings at any time, but some
            required cookies are necessary for login, navigation, and security.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button href="/privacy" variant="secondary" size="md">
              Review privacy
            </Button>
            <Button href="/feedback" size="md" showArrow>
              Ask a question
            </Button>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
