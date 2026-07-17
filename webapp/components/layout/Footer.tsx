"use client";

import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Logo } from "@/components/ui/Logo";
import { useAuth, hasRole } from "@/components/providers/AuthProvider";
import { footerLinkCols } from "@/lib/constants";

type FooterProps = {
  showAuthLinks?: boolean;
};

export function Footer({ showAuthLinks = true }: FooterProps) {
  const { loggedIn, user } = useAuth();
  const visibleLinkCols = footerLinkCols.map((col) => ({
    ...col,
    links: showAuthLinks
      ? col.links
      : col.links.filter((link) => link.label !== "Login" && link.label !== "Register"),
  }));

  return (
    <footer className="section-shell border-t border-border bg-page">
      <div className="section-container">
        <div className="content-container mx-auto px-4 md:px-10">
          <Reveal className="flex flex-col gap-10 border-b border-border-strong/40 py-14 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5">
                <Logo />
                <span className="text-lg font-semibold tracking-tight-2">
                  Nyayantar
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-text-muted">
                The calm, intelligent workspace for legal research, document
                analysis, and case intelligence. Built for lawyers, not bots.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent2" />
                All systems operational
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {visibleLinkCols.map((col) => (
                <div key={col.title}>
                  <h4 className="text-sm font-semibold text-text">{col.title}</h4>
                  <ul className="mt-3 space-y-2.5">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-sm text-text-muted framer-transition hover:text-text"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal
            delay={0.1}
            className="flex flex-col items-start justify-between gap-4 py-7 text-xs text-text-muted sm:flex-row sm:items-center"
          >
            <p>© {new Date().getFullYear()} Nyayantar Labs. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <Link href="/" className="framer-transition hover:text-text">
                Home
              </Link>
              {showAuthLinks && (
                <>
                  <Link href="/login" className="framer-transition hover:text-text">
                    Login
                  </Link>
                  <Link href="/register" className="framer-transition hover:text-text">
                    Register
                  </Link>
                  {loggedIn && hasRole(user, ["admin", "sudo_admin", "super_admin"]) && (
                    <Link href="/admin" className="framer-transition hover:text-text">
                      Admin
                    </Link>
                  )}
                </>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </footer>
  );
}
