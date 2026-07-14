"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { stagger, revealItem, viewportOnce } from "@/lib/motion";
import { plans } from "@/lib/constants";

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="section-shell py-14 md:py-[60px]">
      <div className="section-container">
        <div className="content-container mx-auto px-4 md:px-10">
          <Reveal className="mx-auto max-w-pricing-title text-center">
            <p className="text-sm font-medium text-accent1">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight-2 sm:text-4xl">
              Smarter plans for smarter workflows.
            </h2>
          </Reveal>

          <Reveal delay={0.1} className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-border bg-surface px-2 py-1.5">
              <button
                type="button"
                onClick={() => setAnnual(false)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium framer-transition ${
                  !annual ? "primary-gradient text-white" : "text-text-muted"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium framer-transition ${
                  annual ? "primary-gradient text-white" : "text-text-muted"
                }`}
              >
                Annual
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    annual ? "bg-white/20" : "bg-accent2/10 text-accent1"
                  }`}
                >
                  -20%
                </span>
              </button>
            </div>
          </Reveal>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={stagger}
            className="mt-10 grid gap-6 lg:grid-cols-3"
          >
            {plans.map((p) => {
              const price = annual ? p.annual : p.monthly;
              return (
                <motion.div
                  key={p.name}
                  variants={revealItem}
                  className={`relative flex flex-col rounded-3xl p-7 framer-transition ${
                    p.highlight
                      ? "accent-border-wrap"
                      : "border border-border bg-surface"
                  }`}
                >
                  <div
                    className={`rounded-3xl p-7 ${
                      p.highlight ? "bg-surface" : ""
                    }`}
                  >
                    {p.highlight && (
                      <span className="absolute -top-3 left-7 rounded-full bg-surface px-3 py-1 text-xs font-medium text-accent1 shadow-sm">
                        Most popular
                      </span>
                    )}
                    <h3 className="text-lg font-semibold tracking-tight-2">
                      {p.name}
                    </h3>
                    <p className="mt-1.5 text-sm text-text-muted">
                      {p.description}
                    </p>

                    <div className="mt-6 flex items-end gap-1">
                      {p.name === "Enterprise" ? (
                        <span className="text-3xl font-semibold tracking-tight-2">
                          Custom
                        </span>
                      ) : (
                        <>
                          <span className="text-4xl font-semibold tracking-tight-2">
                            ${price}
                          </span>
                          <span className="mb-1.5 text-sm text-text-muted">
                            /mo
                          </span>
                        </>
                      )}
                    </div>
                    {p.name !== "Enterprise" && (
                      <p className="mt-1 text-xs text-text-muted">
                        {annual ? "billed annually" : "billed monthly"}
                      </p>
                    )}

                    <div className="mt-6">
                      <Button
                        href="#cta"
                        variant={p.highlight ? "primary" : "secondary"}
                        size="md"
                        showArrow
                        className="w-full"
                      >
                        {p.cta}
                      </Button>
                    </div>

                    <ul className="mt-7 space-y-3">
                      {p.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2.5 text-sm text-text"
                        >
                          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-tint text-accent1">
                            <Icon name="check" size={13} />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
