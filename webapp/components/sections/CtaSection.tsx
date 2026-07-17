"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { GradientLabel } from "@/components/ui/GradientLabel";
import { Button } from "@/components/ui/Button";
import { tickerWords } from "@/lib/constants";

export function CtaSection() {
  return (
    <section id="cta" className="section-shell pt-16 md:pt-[72px]">
      <div className="section-container">
        <div className="content-container mx-auto px-4 md:px-10">
          <div className="flex flex-col-reverse gap-10 md:flex-col">
            {/* subtle moving ticker */}
            <div className="section-shell border-y border-border">
              <div className="section-container mx-auto max-w-[1040px] min-w-0 overflow-hidden py-4">
                <motion.div
                  className="flex w-max shrink-0 items-center gap-8 whitespace-nowrap"
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                >
                  {[...tickerWords, ...tickerWords].map((w, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-8 text-[13px] font-medium text-text/35"
                    >
                      {w}
                      <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />
                    </span>
                  ))}
                </motion.div>
              </div>
            </div>

            <Reveal>
                 <div className="relative mx-auto max-w-[920px] overflow-hidden rounded-[28px] border border-border bg-surface px-6 py-14 text-center md:px-10 md:py-16">
                <div className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-accent1/8 blur-3xl" />
                <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-accent2/8 blur-3xl" />

                <div className="relative">
                  <GradientLabel>Join the beta</GradientLabel>
                  <h2 className="mx-auto mt-4 max-w-[560px] text-[40px] font-semibold leading-[1.05] tracking-tight-3 sm:text-[56px]">
                    Ready to rethink legal work?
                  </h2>
                  <p className="mx-auto mt-4 max-w-[520px] text-[16px] leading-7 text-text-muted md:text-[17px]">
                    Explore the product flow, pricing, and workspace preview in
                    one clean place. No clutter — just the research, drafting,
                    and review tools you need.
                  </p>
                  <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                    <Button href="#workspace" size="lg" showArrow className="w-full sm:w-auto">
                      See it in action
                    </Button>
                    <Button href="#pricing" variant="ghost" size="lg" className="w-full sm:w-auto">
                      View pricing
                    </Button>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
