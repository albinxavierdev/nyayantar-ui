"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { Icon, type IconName } from "@/components/ui/Icon";
import { stagger, revealItem, viewportOnce } from "@/lib/motion";
import { builtPoints } from "@/lib/constants";

export function BuiltSection() {
  return (
    <section id="built" className="section-shell py-16 md:py-[72px]">
      <div className="section-container">
        <div className="content-container mx-auto px-4 md:px-10">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-base font-medium text-accent1">Why Nyayantar</p>
            <h2 className="mt-4 text-[40px] font-semibold leading-[1.05] tracking-tight-3 sm:text-[56px]">
              Calm software for a high-stakes job.
            </h2>
            <p className="mt-4 text-lg leading-7 text-text-muted">
              We removed the clutter so you can focus on judgment. Nyayantar does
              the searching, reading, and summarizing — you do the lawyering.
            </p>
          </Reveal>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={stagger}
            className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-3"
          >
            {builtPoints.map((p) => (
              <motion.div
                key={p.title}
                variants={revealItem}
                className="rounded-2xl border border-border bg-surface-tint/70 p-5 framer-transition hover:-translate-y-1 hover:border-border-strong"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-accent1 shadow-[0_8px_20px_rgba(141,75,44,0.08)]">
                  <Icon name={p.icon} size={20} />
                </span>
                <h3 className="mt-4 text-base font-semibold tracking-tight-2">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-text-muted">{p.copy}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
