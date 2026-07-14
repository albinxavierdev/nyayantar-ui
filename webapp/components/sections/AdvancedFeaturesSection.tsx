"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { Icon, type IconName } from "@/components/ui/Icon";
import { stagger, revealItem, viewportOnce } from "@/lib/motion";
import { advancedCapabilities } from "@/lib/constants";

export function AdvancedFeaturesSection() {
  return (
    <section className="section-shell py-14 md:py-[60px]">
      <div className="section-container">
        <div className="content-container mx-auto px-4 md:px-10">
          <div className="overflow-hidden rounded-3xl border border-border bg-surface-tint/60">
            <div className="px-6 py-10 md:px-12 md:py-12">
              <Reveal className="max-w-title">
                <p className="text-sm font-medium text-accent1">
                  Advanced capabilities
                </p>
                <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight-2 sm:text-4xl">
                  Effortless on the surface, serious underneath.
                </h2>
                <p className="mt-4 text-lg leading-7 text-text-muted">
                  The depth you need for real matters, hidden behind an interface
                  that gets out of your way.
                </p>
              </Reveal>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                variants={stagger}
                className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3"
              >
                {advancedCapabilities.map((c) => (
                  <motion.div
                    key={c.title}
                    variants={revealItem}
                    className="bg-surface p-6 framer-transition hover:bg-surface-tint/80"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-accent1">
                      <Icon name={c.icon} size={20} />
                    </span>
                    <h3 className="mt-4 text-base font-semibold tracking-tight-2">
                      {c.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-text-muted">
                      {c.copy}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
