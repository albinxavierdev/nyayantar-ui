import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";

const practices = [
  {
    title: "Encryption",
    copy:
      "Traffic is protected in transit and data is stored with encryption at rest wherever the product handles persistent content.",
  },
  {
    title: "Access control",
    copy:
      "Authentication flows are separated into login and register routes, and privileged surfaces are only linked from authenticated UI.",
  },
  {
    title: "Monitoring",
    copy:
      "Operational dashboards and alerting help the team watch for unhealthy behavior, unusual traffic, or service issues.",
  },
  {
    title: "Incident response",
    copy:
      "If something needs review, the feedback path and admin console keep operational work organized and visible.",
  },
] as const;

export default function SecurityPage() {
  return (
    <PageShell
      eyebrow="Trust"
      title="Security overview"
      description="A concise look at the security practices and product controls that help keep the platform calm and reliable."
      actions={
        <>
          <Button href="/admin" variant="secondary" size="lg">
            Admin panel
          </Button>
          <Button href="/feedback" size="lg" showArrow>
            Report a concern
          </Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {practices.map((practice) => (
          <Reveal key={practice.title} className="card-surface p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-accent1">
              <Icon name="shield" size={16} />
              {practice.title}
            </div>
            <p className="mt-3 text-sm leading-6 text-text-muted">{practice.copy}</p>
          </Reveal>
        ))}

        <Reveal className="card-surface p-6 lg:col-span-2">
          <div className="flex items-center gap-2 text-sm font-medium text-accent1">
            <Icon name="users" size={16} />
            Review and escalation
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-text-muted">
            If you discover a problem, use feedback or the admin surface so the
            right team can review it quickly and keep the experience stable.
          </p>
        </Reveal>
      </div>
    </PageShell>
  );
}
