"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { Icon, type IconName } from "@/components/ui/Icon";
import { stagger, revealItem, viewportOnce } from "@/lib/motion";
import { featureItems } from "@/lib/constants";

export function FeatureIntroSection() {
  return (
    <section id="features" className="section-shell py-14 md:py-[60px]">
      <div className="section-container">
        <div className="content-container mx-auto px-4 md:px-10">
          <Reveal className="max-w-title">
            <p className="text-sm font-medium text-accent1">Built for practice</p>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight-2 sm:text-4xl">
              Everything you need to move a matter forward.
            </h2>
          </Reveal>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={stagger}
            className="mt-10 grid gap-6 md:grid-cols-3"
          >
            {featureItems.map((f) => (
              <motion.div
                key={f.title}
                variants={revealItem}
                className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 framer-transition hover:-translate-y-1 hover:border-border-strong"
                style={{ borderTop: `2px solid ${f.accent}` }}
              >
                <span
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: `${f.accent}14`, color: f.accent }}
                >
                  <Icon name={f.icon} size={22} />
                </span>
                <h3 className="mt-5 text-xl font-semibold tracking-tight-2">
                  {f.title}
                </h3>
                <p className="mt-2.5 max-w-card-copy text-sm leading-6 text-text-muted">
                  {f.copy}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
