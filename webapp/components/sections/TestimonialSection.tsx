"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import { testimonials } from "@/lib/constants";

export function TestimonialSection() {
  const feedbackItems = testimonials.filter((item) => item.quote.trim().length > 0);
  const [i, setI] = useState(0);

  if (!feedbackItems.length) {
    return null;
  }

  const t = feedbackItems[i % feedbackItems.length];

  const go = useCallback((dir: number) => {
    setI((p) => (p + dir + feedbackItems.length) % feedbackItems.length);
  }, []);

  return (
    <section className="section-shell py-16 md:py-[72px]">
      <div className="section-container">
        <div className="content-container mx-auto px-4 md:px-10">
          <Reveal className="max-w-title">
            <p className="text-base font-medium text-accent1">Loved by lawyers</p>
            <h2 className="mt-4 text-[40px] font-semibold leading-[1.05] tracking-tight-3 sm:text-[56px]">
              Work that earns trust.
            </h2>
          </Reveal>

          <Reveal delay={0.1} className="mt-8">
            <div className="card-surface relative mx-auto max-w-[880px] overflow-hidden p-6 md:p-9">
              <Icon
                name="quote"
                size={32}
                className="absolute right-6 top-6 text-border-strong/50"
              />
              <AnimatePresence mode="wait">
                <motion.figure
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.5, ease: [0.44, 0, 0.56, 1] }}
                  className="max-w-2xl"
                >
                  <blockquote className="text-xl font-medium leading-8 tracking-tight-2 text-text md:text-2xl">
                    "{t.quote}"
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3.5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full primary-gradient text-sm font-semibold text-white">
                      {t.initials}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-text">{t.name}</p>
                      <p className="text-sm text-text-muted">{t.role}</p>
                    </div>
                  </figcaption>
                </motion.figure>
              </AnimatePresence>

              <div className="mt-6 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous testimonial"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-text framer-transition hover:border-text/30"
                >
                  <Icon name="arrow" size={18} className="rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next testimonial"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-text framer-transition hover:border-text/30"
                >
                  <Icon name="arrow" size={18} />
                </button>
                <div className="ml-2 flex items-center gap-1.5" role="tablist" aria-label="Testimonial navigation">
                  {feedbackItems.map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 rounded-full framer-transition ${
                        idx === i ? "w-5 bg-accent1" : "w-1.5 bg-border-strong"
                      }`}
                      role="tab"
                      aria-selected={idx === i}
                      aria-label={`Testimonial ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
