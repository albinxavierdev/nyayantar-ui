"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import { faqs } from "@/lib/constants";

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  const toggle = useCallback((i: number) => {
    setOpen((prev) => (prev === i ? null : i));
  }, []);

  return (
    <section id="faq" className="section-shell py-14 md:py-[60px]">
      <div className="section-container">
        <div className="content-container mx-auto px-4 md:px-10">
          <Reveal className="mx-auto max-w-pricing-title text-center">
            <p className="text-sm font-medium text-accent1">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight-2 sm:text-4xl">
              Questions, answered.
            </h2>
          </Reveal>

          <Reveal delay={0.1} className="mx-auto mt-10 max-w-2xl">
            <div className="divide-y divide-border-strong/40 overflow-hidden rounded-3xl border border-border bg-surface">
              {faqs.map((f, i) => {
                const isOpen = open === i;
                const buttonId = `faq-button-${i}`;
                const panelId = `faq-panel-${i}`;
                return (
                  <div key={f.q}>
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggle(i)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    >
                      <span className="text-base font-medium tracking-tight-2 text-text">
                        {f.q}
                      </span>
                      <span
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-text framer-transition ${
                          isOpen ? "rotate-45 bg-surface-tint" : ""
                        }`}
                      >
                        <Icon name="close" size={16} />
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: [0.44, 0, 0.56, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="px-6 pb-6 text-sm leading-6 text-text-muted">
                            {f.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
