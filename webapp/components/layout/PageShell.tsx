import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { GradientLabel } from "@/components/ui/GradientLabel";

type PageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: PageShellProps) {
  return (
    <>
      <Header />
      <main className="page-bg min-h-[100dvh]">
        <section className="section-shell overflow-hidden py-12 md:py-16">
          <div className="section-container">
            <div className="content-container mx-auto px-4 md:px-10">
              <Reveal className="max-w-3xl">
                <GradientLabel>{eyebrow}</GradientLabel>
                <h1 className="mt-4 text-4xl font-semibold leading-[1.06] tracking-tight-3 text-balance sm:text-5xl lg:text-[60px]">
                  {title}
                </h1>
                <p className="mt-5 max-w-3xl text-lg leading-7 text-text-muted">
                  {description}
                </p>
                {actions && (
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    {actions}
                  </div>
                )}
              </Reveal>

              <div className="mt-10">{children}</div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
