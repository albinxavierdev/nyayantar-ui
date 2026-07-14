"use client";

import { Reveal } from "@/components/ui/Reveal";

export function SpacerDivider() {
  return (
    <section className="section-shell">
      <div className="section-container">
        <Reveal className="content-container mx-auto px-4 md:px-10">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-border-strong/50 to-transparent" />
        </Reveal>
      </div>
    </section>
  );
}
