"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { useAuth, hasRole } from "@/components/providers/AuthProvider";
import { navItems } from "@/lib/constants";

type HeaderProps = {
  showAuthActions?: boolean;
};

export function Header({ showAuthActions = true }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { loggedIn, user, logout } = useAuth();

  const handleMenuToggle = useCallback(() => {
    setMenuOpen((v) => !v);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleNavToggle = useCallback(() => {
    setOpen((v) => !v);
  }, []);

  const handleLogout = useCallback(() => {
    handleMenuClose();
    logout();
  }, [handleMenuClose, logout]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-page/80 backdrop-blur-md">
      <div className="section-shell">
        <div className="section-container">
          <div className="content-container mx-auto flex items-center justify-between px-4 py-3.5 md:px-10">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo />
              <span className="text-lg font-semibold tracking-tight-2">
                Nyayantar
                <span className="ml-1 rounded-md bg-surface-tint px-1.5 py-0.5 text-[10px] font-medium text-text-muted align-middle">
                  Beta
                </span>
              </span>
            </Link>

            <nav className="hidden items-center gap-9 xl:flex">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium text-text-muted framer-transition hover:text-text"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-3 xl:flex">
              {showAuthActions && (
                <>
                  {loggedIn ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={handleMenuToggle}
                        className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3 framer-transition hover:border-text/30"
                        aria-label="Account menu"
                        aria-expanded={menuOpen}
                        aria-haspopup="true"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full primary-gradient text-xs font-semibold text-white">
                          {user?.initials ?? "U"}
                        </span>
                        <Icon
                          name="arrow"
                          size={14}
                          className={`rotate-90 text-text-muted framer-transition ${
                            menuOpen ? "rotate-[270deg]" : ""
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {menuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.25, ease: [0.44, 0, 0.56, 1] }}
                            className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-surface p-2 shadow-[0_16px_40px_rgba(141,75,44,0.12)]"
                            role="menu"
                            aria-orientation="vertical"
                          >
                            <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
                              <span className="flex h-9 w-9 items-center justify-center rounded-full primary-gradient text-xs font-semibold text-white">
                                {user?.initials ?? "U"}
                              </span>
                              <div className="min-w-0 leading-tight">
                                <p className="truncate text-sm font-semibold text-text">
                                  {user?.name ?? "User"}
                                </p>
                                <p className="truncate text-xs text-text-muted">
                                  {user?.email}
                                </p>
                              </div>
                            </div>
                            <div className="my-1 h-px bg-border" />
                            <Link
                              href="/chat"
                              onClick={handleMenuClose}
                              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-text-muted framer-transition hover:bg-surface-tint hover:text-text"
                              role="menuitem"
                            >
                              <Icon name="users" size={16} />
                              Open workspace
                            </Link>
                            <Link
                              href="/admin"
                              onClick={handleMenuClose}
                              className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium framer-transition hover:bg-surface-tint hover:text-text ${
                                hasRole(user, ["admin", "sudo_admin", "super_admin"]) ? "text-text-muted" : "hidden"
                              }`}
                              role="menuitem"
                            >
                              <Icon name="shield" size={16} />
                              Admin panel
                            </Link>
                            <Link
                              href="/"
                              onClick={handleMenuClose}
                              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-text-muted framer-transition hover:bg-surface-tint hover:text-text"
                              role="menuitem"
                            >
                              <Icon name="scale" size={16} />
                              Home
                            </Link>
                            <button
                              type="button"
                              onClick={handleLogout}
                              className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-text-muted framer-transition hover:bg-surface-tint hover:text-text"
                              role="menuitem"
                            >
                              <Icon name="close" size={16} />
                              Sign out
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <>
                      <Button href="/login" variant="secondary" size="md">
                        Sign in
                      </Button>
                      <Button href="/register" size="md" showArrow>
                        Get Started
                      </Button>
                    </>
                  )}
                </>
              )}
              {!showAuthActions && (
                <Button href="#workspace" size="md" showArrow>
                  See it in action
                </Button>
              )}
            </div>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-text xl:hidden"
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={handleNavToggle}
            >
              <Icon name={open ? "close" : "menu"} size={20} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.44, 0, 0.56, 1] }}
            className="overflow-hidden border-t border-border xl:hidden"
          >
            <div className="content-container mx-auto flex flex-col gap-1 px-4 py-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted hover:bg-surface-tint hover:text-text"
                >
                  {item.label}
                </a>
              ))}
              {showAuthActions && (
                <div className="mt-2 flex flex-col gap-2">
                  {loggedIn ? (
                    <>
                      <Link
                        href="/chat"
                        onClick={() => setOpen(false)}
                        className="rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted hover:bg-surface-tint hover:text-text"
                      >
                        Open workspace
                      </Link>
                      <Link
                        href="/admin"
                        onClick={() => setOpen(false)}
                        className={`rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-surface-tint hover:text-text ${
                          hasRole(user, ["admin", "sudo_admin", "super_admin"]) ? "text-text-muted" : "hidden"
                        }`}
                      >
                        Admin panel
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-text-muted hover:bg-surface-tint hover:text-text"
                      >
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setOpen(false)}
                        className="rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted hover:bg-surface-tint hover:text-text"
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setOpen(false)}
                        className="rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted hover:bg-surface-tint hover:text-text"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              )}
              <Button
                href={showAuthActions ? "/register" : "#workspace"}
                size="md"
                showArrow
                className="w-full"
              >
                {showAuthActions ? "Get Started" : "See it in action"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
