"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { GradientLabel } from "@/components/ui/GradientLabel";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { stagger, revealItem, viewportOnce } from "@/lib/motion";

const adminHighlights = [
  {
    icon: "users" as const,
    title: "User approvals",
    copy:
      "Review new accounts, assign access levels, and keep the platform aligned to the right teams.",
  },
  {
    icon: "doc" as const,
    title: "Policy and content",
    copy:
      "Update legal pages, announcements, and feature notes without touching the rest of the product flow.",
  },
  {
    icon: "shield" as const,
    title: "Feedback triage",
    copy:
      "Sort product feedback, flag security concerns, and route sensitive requests to the right owners.",
  },
] as const;

export function AdminSection() {
  return (
    <section id="admin-panel" className="section-shell py-14 md:py-[64px]">
      <div className="section-container">
        <div className="content-container mx-auto px-4 md:px-10">
          <div className="rounded-[28px] border border-border bg-surface/90 p-6 md:p-8">
            <Reveal className="max-w-title">
              <GradientLabel>Admin panel</GradientLabel>
              <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight-2 sm:text-4xl">
                Keep operations calm, clear, and under control.
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-text-muted">
                The admin surface keeps moderation, user access, and feedback in one
                place so the product stays easy to govern as it grows.
              </p>
            </Reveal>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              variants={stagger}
              className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]"
            >
              <motion.div variants={revealItem} className="grid gap-5 md:grid-cols-3">
                {adminHighlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-border bg-surface p-5 framer-transition hover:-translate-y-1 hover:border-border-strong"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-surface-tint text-accent1">
                      <Icon name={item.icon} size={20} />
                    </span>
                    <h3 className="mt-4 text-base font-semibold tracking-tight-2">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-text-muted">
                      {item.copy}
                    </p>
                  </div>
                ))}
              </motion.div>

              <motion.div
                variants={revealItem}
                className="card-surface relative overflow-hidden p-6 md:p-7"
              >
                <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-accent1/8 blur-3xl" />
                <div className="pointer-events-none absolute -left-14 -bottom-14 h-36 w-36 rounded-full bg-accent2/8 blur-3xl" />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-accent1">Live status</p>
                      <h3 className="mt-1 text-xl font-semibold tracking-tight-2">
                        98% healthy
                      </h3>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-tint px-3 py-1 text-xs text-text-muted">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent2" />
                      Monitoring
                    </span>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Active users", value: "1,284" },
                      { label: "Feedback items", value: "36" },
                      { label: "Pending reviews", value: "8" },
                      { label: "System alerts", value: "0" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-2xl border border-border bg-surface p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                          {stat.label}
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight-2 text-text">
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button href="/admin" size="md" showArrow className="w-full">
                      Open admin panel
                    </Button>
                    <Button href="/feedback" variant="secondary" size="md" className="w-full">
                      View feedback
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
