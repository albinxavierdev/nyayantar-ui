"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { GradientLabel } from "@/components/ui/GradientLabel";
import { Button } from "@/components/ui/Button";
import { ChatWindow } from "@/components/chat/ChatWindow";

export function WorkspaceSection() {
  return (
    <section id="workspace" className="section-shell py-16 md:py-[72px]">
      <div className="section-container">
        <div className="content-container mx-auto px-4 md:px-10">
          <Reveal className="max-w-title">
            <GradientLabel>See it in action</GradientLabel>
            <h2 className="mt-4 text-[40px] font-semibold leading-[1.05] tracking-tight-3 sm:text-[56px]">
              A live preview of the research flow.
            </h2>
            <p className="mt-4 max-w-[520px] text-lg leading-7 text-text-muted">
              One calm place for research, drafting, and review. Every answer
              traces back to a source you can verify.
            </p>
          </Reveal>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45 }}
            className="mt-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-12"
          >
            <div className="card-surface relative mx-auto w-full max-w-[440px] overflow-hidden p-6 md:p-8">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent1/8 blur-3xl" />
              <div className="relative">
                <h3 className="text-xl font-semibold tracking-tight-2">
                  Research workspace preview
                </h3>
                <p className="mt-1.5 text-sm text-text-muted">
                  Explore the same calm interface the product uses for research
                  threads, citation checks, and document review.
                </p>

                  <div className="mt-6 space-y-3">
                    <div className="rounded-2xl border border-border bg-surface px-4 py-3">
                      <p className="text-sm font-medium text-text">
                        Live research preview
                      </p>
                      <p className="mt-1 text-sm leading-6 text-text-muted">
                        The workspace keeps the thread, source, and summary aligned
                        so the page stays readable as the work gets more complex.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button href="/chat" size="lg" showArrow className="w-full">
                        Open workspace
                      </Button>
                      <Button href="#features" variant="secondary" size="lg" className="w-full">
                        See features
                      </Button>
                    </div>
                  </div>
              </div>
            </div>

            <div className="min-w-0">
              <ChatWindow />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
