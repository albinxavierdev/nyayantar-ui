"use client";

import { motion } from "framer-motion";
import { GradientLabel } from "@/components/ui/GradientLabel";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { float, viewportOnce } from "@/lib/motion";
import { benefits } from "@/lib/constants";

export function HeroSection() {
  return (
    <section id="top" className="section-shell overflow-hidden pt-16 md:pt-24 lg:pt-20">
      <div className="section-container">
        <div className="content-container mx-auto grid min-w-0 grid-cols-1 items-center gap-12 px-4 pb-16 md:px-10 lg:grid-cols-2 lg:gap-10 lg:pb-24">
          {/* Left — copy */}
          <div className="order-2 min-w-0 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.44, 0, 0.56, 1] }}
            >
              <GradientLabel>Beta is live — early access open</GradientLabel>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.44, 0, 0.56, 1], delay: 0.08 }}
              className="mt-6 text-4xl font-semibold leading-[1.06] tracking-tight-3 text-balance sm:text-5xl lg:text-[64px] lg:leading-[1.05]"
            >
              Legal research,{" "}
              <span className="gradient-text">rethought</span> for the way you
              actually work.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.44, 0, 0.56, 1], delay: 0.16 }}
              className="mt-6 max-w-hero-copy text-lg leading-7 text-text-muted"
            >
              Nyayantar is the calm, intelligent workspace for legal research,
              document analysis, and case intelligence. Draft faster, cite with
              confidence, and surface the precedent that wins — without the noise.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.44, 0, 0.56, 1], delay: 0.24 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Button href="#cta" size="lg" showArrow className="w-full sm:w-auto">
                Start free
              </Button>
              <Button href="#features" variant="secondary" size="lg" className="w-full sm:w-auto">
                See how it works
              </Button>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.44, 0, 0.56, 1], delay: 0.32 }}
              className="mt-8 flex flex-col gap-3"
            >
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm text-text">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface-tint text-accent1">
                    <Icon name="check" size={13} />
                  </span>
                  {b}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Right — simplified visual composition */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.44, 0, 0.56, 1], delay: 0.2 }}
            className="order-1 min-w-0 lg:order-2"
          >
            <motion.div
              variants={float}
              animate="animate"
              className="card-surface relative min-w-0 overflow-hidden rounded-3xl p-5"
            >
              {/* soft inner glow */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-accent1/20 to-accent2/10 blur-2xl" />

              <div className="relative flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-tint text-text">
                    <Icon name="doc" size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-tight">
                      Employment_Agreement.pdf
                    </p>
                    <p className="text-xs text-text-muted">42 pages · analyzed</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-tint px-2.5 py-1 text-xs text-text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent2" />
                  Synced
                </span>
              </div>

              <div className="relative mt-4 space-y-2.5">
                {[100, 92, 78, 64].map((w, i) => (
                  <div
                    key={i}
                    className="h-2.5 rounded-full bg-border"
                    style={{ width: `${w}%` }}
                  />
                ))}
                <div className="relative mt-1 rounded-xl border border-accent-border-gradient/40 bg-surface-tint/60 p-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-accent1">
                    <Icon name="spark" size={14} />
                    Key clause detected
                  </div>
                  <p className="mt-1.5 text-[13px] leading-5 text-text">
                    Non-compete limited to 12 months within Maharashtra — likely
                    enforceable per §27 IPC.
                  </p>
                </div>
                <div className="h-2.5 w-[70%] rounded-full bg-border" />
              </div>

              <div className="relative mt-4 flex items-center gap-3 rounded-2xl bg-page p-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg primary-gradient text-white">
                  <Icon name="brain" size={16} />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-text">AI summary</p>
                  <p className="text-[11px] leading-4 text-text-muted">
                    Generated 6 precedents · 2 conflicting
                  </p>
                </div>
                <Icon name="arrow" size={16} className="text-text-muted" />
              </div>
            </motion.div>

            {/* one restrained floating chip */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-4 left-0 hidden rounded-2xl border border-border bg-surface px-3 py-2 shadow-[0_16px_40px_rgba(141,75,44,0.10)] sm:flex sm:items-center sm:gap-2"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-tint text-accent2">
                <Icon name="shield" size={15} />
              </span>
              <div className="leading-tight">
                <p className="text-xs font-semibold text-text">Cite-checked</p>
                <p className="text-[10px] text-text-muted">every claim</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
