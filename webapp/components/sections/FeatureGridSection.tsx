"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { Icon, type IconName } from "@/components/ui/Icon";
import { stagger, revealItem, viewportOnce } from "@/lib/motion";
import { gridCards } from "@/lib/constants";

type CardWithVisual = {
  icon: IconName;
  title: string;
  copy: string;
  visual: React.ReactNode;
};

const cards: CardWithVisual[] = [
  {
    icon: "search",
    title: "Ask. Get precedent.",
    copy: "Natural-language research across statutes, judgments, and commentary — ranked by relevance to your facts.",
    visual: (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
          <Icon name="search" size={15} className="text-accent1" />
          <span className="text-xs text-text-muted">
            {"\"Liability for defective goods?\""}
          </span>
        </div>
        {[
          { t: "Consumer Protection Act §2(10)", s: "94% match" },
          { t: "Satyam v. State (2019)", s: "88% match" },
          { t: "Sale of Goods Act §16", s: "81% match" },
        ].map((r) => (
          <div
            key={r.t}
            className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2"
          >
            <span className="text-xs font-medium text-text">{r.t}</span>
            <span className="rounded-full bg-surface-tint px-2 py-0.5 text-[10px] text-text-muted">
              {r.s}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: "doc",
    title: "Read a 200-page brief in 20 seconds.",
    copy: "Nyayantar summarizes filings, extracts obligations, and turns dense prose into a clean, cite-linked brief.",
    visual: (
      <div className="space-y-2.5">
        <div className="flex gap-2">
          <div className="flex-1 space-y-1.5">
            {[100, 86, 70, 92].map((w, i) => (
              <div key={i} className="h-2 rounded-full bg-border" style={{ width: `${w}%` }} />
            ))}
          </div>
          <div className="flex-1 space-y-1.5">
            {[78, 100, 64, 82].map((w, i) => (
              <div key={i} className="h-2 rounded-full bg-border" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-accent-border-gradient/40 bg-surface-tint/60 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-accent1">
            <Icon name="spark" size={12} /> Summary
          </p>
          <p className="mt-1 text-[11px] leading-4 text-text">
            Three renewal dates, one indemnity cap, zero penalty clauses found.
          </p>
        </div>
      </div>
    ),
  },
  {
    icon: "shield",
    title: "Catch the risk before opposing counsel does.",
    copy: "Automated clause review flags ambiguous language, missing definitions, and terms that drift from your playbook.",
    visual: (
      <div className="space-y-2">
        {[
          { t: "Non-compete scope", v: "Review", c: "text-accent3", b: "bg-accent3/10" },
          { t: "Termination notice", v: "OK", c: "text-accent1", b: "bg-accent1/10" },
          { t: "Governing law", v: "OK", c: "text-accent1", b: "bg-accent1/10" },
          { t: "Liability cap", v: "Missing", c: "text-accent3", b: "bg-accent3/10" },
        ].map((r) => (
          <div
            key={r.t}
            className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2"
          >
            <span className="text-xs text-text">{r.t}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.b} ${r.c}`}>
              {r.v}
            </span>
          </div>
        ))}
      </div>
    ),
  },
];

export function FeatureGridSection() {
  return (
    <section className="section-shell py-14 md:py-[60px]">
      <div className="section-container">
        <div className="content-container mx-auto px-4 md:px-10">
          <Reveal className="max-w-title">
            <p className="text-sm font-medium text-accent1">The workspace</p>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight-2 sm:text-4xl">
              One place for research, drafting, and review.
            </h2>
          </Reveal>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={stagger}
            className="mt-10 grid gap-6 lg:grid-cols-3"
          >
            {cards.map((c) => (
              <motion.div
                key={c.title}
                variants={revealItem}
                className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-surface framer-transition hover:-translate-y-1 hover:border-border-strong"
              >
                <div className="border-b border-border bg-surface-tint/50 p-5">
                  {c.visual}
                </div>
                <div className="p-6">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-tint text-accent1">
                    <Icon name={c.icon} size={20} />
                  </span>
                  <h3 className="mt-4 text-xl font-semibold leading-snug tracking-tight-2">
                    {c.title}
                  </h3>
                  <p className="mt-2.5 max-w-wide-card-copy text-sm leading-6 text-text-muted">
                    {c.copy}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
