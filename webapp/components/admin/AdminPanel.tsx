"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { hasRole } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { GradientLabel } from "@/components/ui/GradientLabel";
import { Reveal } from "@/components/ui/Reveal";
import { stagger, revealItem, viewportOnce } from "@/lib/motion";

type AdminTab = "overview" | "users" | "feedback" | "security";

const allTabs: { id: AdminTab; label: string; icon: Parameters<typeof Icon>[0]["name"]; roles: Parameters<typeof hasRole>[1] }[] = [
  { id: "overview", label: "Overview", icon: "chart", roles: ["admin", "sudo_admin", "super_admin"] },
  { id: "users", label: "Users", icon: "users", roles: ["admin", "sudo_admin", "super_admin"] },
  { id: "feedback", label: "Feedback", icon: "quote", roles: ["sudo_admin", "super_admin"] },
  { id: "security", label: "Security", icon: "shield", roles: ["super_admin"] },
];

const activityRows = [
  {
    title: "Approve new firm onboarding",
    meta: "3 pending approvals",
    status: "Action needed",
  },
  {
    title: "Review feedback on OTP login",
    meta: "12 comments this week",
    status: "High volume",
  },
  {
    title: "Publish updated privacy policy",
    meta: "Ready for review",
    status: "Draft",
  },
] as const;

const quickStats = [
  { label: "Daily sign-ins", value: "842" },
  { label: "Open feedback", value: "36" },
  { label: "Policy drafts", value: "4" },
  { label: "Risk alerts", value: "2" },
] as const;

const recentFeedback = [
  {
    name: "Ananya Rao",
    category: "Login",
    note: "OTP flow is clear, but a resend button would help.",
  },
  {
    name: "Devansh Mehta",
    category: "Admin",
    note: "Need a faster way to triage legal page edits.",
  },
  {
    name: "Priya Nair",
    category: "Trust",
    note: "The privacy page should be easier to locate in the footer.",
  },
] as const;

export function AdminPanel() {
  const { loggedIn, user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  const tabs = useMemo(() => allTabs.filter((tab) => hasRole(user, tab.roles)), [user]);
  const allowedTabs = useMemo(() => tabs.map((t) => t.id), [tabs]);

  useEffect(() => {
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0] ?? "overview");
    }
  }, [allowedTabs, activeTab]);

  const activeCopy = useMemo(() => {
    switch (activeTab) {
      case "users":
        return {
          title: "User access and approvals",
          description: "Review account requests, assign roles, and keep teams organized.",
        };
      case "feedback":
        return {
          title: "Feedback inbox",
          description: "Route product feedback and surface the highest priority themes.",
        };
      case "security":
        return {
          title: "Security operations",
          description: "Monitor policies, alerts, and recent changes in one calm surface.",
        };
      default:
        return {
          title: "Admin overview",
          description: "A quick read on platform health, operations, and governance.",
        };
    }
  }, [activeTab]);

  return (
    <main className="page-bg min-h-[100dvh]">
      <div className="section-shell">
        <div className="section-container">
          <div className="content-container mx-auto px-4 py-5 md:px-10">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-2.5">
                <Logo />
                <span className="text-lg font-semibold tracking-tight-2">
                  Nyayantar
                  <span className="ml-1 rounded-md bg-surface-tint px-1.5 py-0.5 text-[10px] font-medium text-text-muted align-middle">
                    Admin
                  </span>
                </span>
              </Link>
              <div className="flex items-center gap-2">
                <Button href="/feedback" variant="secondary" size="md">
                  Feedback
                </Button>
                {loggedIn ? (
                  <Button href="/" size="md" showArrow>
                    Back to site
                  </Button>
                ) : (
                  <Button href="/login" size="md" showArrow>
                    Sign in
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="section-shell overflow-hidden py-8 md:py-12 lg:py-14">
        <div className="section-container">
          <div className="content-container mx-auto px-4 md:px-10">
            <Reveal>
              <GradientLabel>Admin console</GradientLabel>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight-3 text-balance sm:text-5xl lg:text-[60px]">
                Platform controls, feedback, and policy tools in one place.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-7 text-text-muted">
                {loggedIn
                  ? `Signed in as ${user?.name ?? "an admin user"}. Keep the product healthy and the experience consistent.`
                  : "Sign in to manage the platform, review feedback, and keep policy pages current."}
              </p>
            </Reveal>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              variants={stagger}
              className="mt-10 grid gap-6 lg:grid-cols-[280px_1fr]"
            >
              <motion.aside
                variants={revealItem}
                className="card-surface overflow-hidden p-4"
              >
                <p className="px-2 py-2 text-sm font-medium text-text-muted">
                  Navigation
                </p>
                <div className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium framer-transition ${
                        activeTab === tab.id
                          ? "bg-surface-tint text-text"
                          : "text-text-muted hover:bg-surface-tint/60 hover:text-text"
                      }`}
                    >
                      <Icon
                        name={tab.icon}
                        size={16}
                        className={activeTab === tab.id ? "text-accent1" : ""}
                      />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                    Current status
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text">
                    Product ops are healthy. Feedback is flowing, and the legal pages
                    are linked from the footer.
                  </p>
                </div>
              </motion.aside>

              <div className="space-y-6">
                <motion.div
                  variants={revealItem}
                  className="grid gap-4 md:grid-cols-4"
                >
                  {quickStats.map((stat) => (
                    <div key={stat.label} className="card-surface p-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                        {stat.label}
                      </p>
                      <p className="mt-2 text-3xl font-semibold tracking-tight-2 text-text">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </motion.div>

                <motion.div
                  variants={revealItem}
                  className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"
                >
                  <div className="card-surface p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-accent1">Focus area</p>
                        <h2 className="mt-1 text-2xl font-semibold tracking-tight-2">
                          {activeCopy.title}
                        </h2>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-tint px-3 py-1 text-xs text-text-muted">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent2" />
                        Live
                      </span>
                    </div>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
                      {activeCopy.description}
                    </p>

                    <div className="mt-6 space-y-3">
                      {activityRows.map((row) => (
                        <div
                          key={row.title}
                          className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-surface px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-text">{row.title}</p>
                            <p className="mt-1 text-xs text-text-muted">{row.meta}</p>
                          </div>
                          <span className="rounded-full bg-surface-tint px-2.5 py-1 text-[11px] text-accent1">
                            {row.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card-surface p-6">
                    <p className="text-sm font-medium text-accent1">Recent feedback</p>
                    <div className="mt-4 space-y-4">
                      {recentFeedback.map((item) => (
                        <div key={item.name} className="rounded-2xl border border-border bg-surface px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-text">{item.name}</p>
                            <span className="rounded-full bg-surface-tint px-2.5 py-1 text-[11px] text-text-muted">
                              {item.category}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-text-muted">
                            {item.note}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                      <Button href="/feedback" size="md" showArrow className="w-full">
                        Open feedback page
                      </Button>
                      <Button href="/privacy" variant="secondary" size="md" className="w-full">
                        Review privacy policy
                      </Button>
                      <Button href="/terms" variant="ghost" size="md" className="w-full">
                        Review terms of use
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
