"use client";

import { Reveal } from "@/components/ui/Reveal";
import { brands } from "@/lib/constants";

export function BrandSection() {
  return (
    <section className="section-shell py-14 md:py-16">
      <div className="section-container">
        <div className="content-container mx-auto border-y border-border px-4 py-10 md:px-10">
          <Reveal>
            <p className="text-center text-sm font-medium text-text-muted">
              Trusted by thousands of legal professionals
            </p>
          </Reveal>
          <Reveal
            delay={0.1}
            className="mt-7 grid grid-cols-2 items-center gap-x-6 gap-y-7 sm:grid-cols-3 lg:grid-cols-6"
          >
            {brands.map((b) => (
              <div
                key={b}
                className="flex items-center justify-center gap-2 text-base font-semibold tracking-tight-2 text-text/45 framer-transition hover:text-text"
              >
                <span className="h-2 w-2 rounded-full bg-border-strong" />
                {b}
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
