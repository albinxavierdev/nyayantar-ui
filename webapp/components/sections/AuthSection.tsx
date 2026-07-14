"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { GradientLabel } from "@/components/ui/GradientLabel";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EASE } from "@/lib/motion";
import { authBenefits } from "@/lib/constants";
import { inputClass } from "@/lib/constants";

type Mode = "signin" | "signup";

const copy = {
  signin: {
    label: "Welcome back",
    title: "Sign in to your workspace.",
    sub: "Pick up right where you left off — your matters, drafts, and research are exactly as you left them.",
  },
  signup: {
    label: "Create your account",
    title: "Start your free beta access.",
    sub: "Set up your workspace in under a minute. Research, draft, and review with citations you can trust.",
  },
} as const;

export function AuthSection() {
  const [mode, setMode] = useState<Mode>("signin");
  const isSignup = mode === "signup";
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();

  return (
    <section id="auth" className="section-shell py-14 md:py-[64px]">
      <div className="section-container">
        <div className="content-container mx-auto px-4 md:px-10">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            {/* Left — brand copy */}
            <Reveal>
              <GradientLabel>{copy[mode].label}</GradientLabel>
              <h2 className="mt-3 max-w-title text-3xl font-semibold leading-[1.1] tracking-tight-2 sm:text-4xl">
                {copy[mode].title}
              </h2>
              <p className="mt-4 max-w-[420px] text-lg leading-7 text-text-muted">
                {copy[mode].sub}
              </p>

              <ul className="mt-8 flex flex-col gap-3">
                {authBenefits.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm text-text">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface-tint text-accent1">
                      <Icon name="check" size={13} />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>

              <div className="mt-8 hidden items-center gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-tint text-accent1">
                  <Icon name="shield" size={18} />
                </span>
                <p className="text-sm leading-5 text-text-muted">
                  Protected by enterprise-grade encryption. We never train on your
                  client data.
                </p>
              </div>
            </Reveal>

            {/* Right — auth card */}
            <Reveal delay={0.1}>
              <div className="card-surface relative mx-auto max-w-[460px] overflow-hidden p-6 md:p-8">
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent1/8 blur-3xl" />
                <div className="pointer-events-none absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-accent2/8 blur-3xl" />

                <div className="relative">
                  {/* Tab switcher */}
                  <div className="flex rounded-2xl bg-surface-tint p-1" role="tablist" aria-label="Authentication mode">
                    {(["signin", "signup"] as Mode[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        role="tab"
                        aria-selected={mode === m}
                        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium framer-transition ${
                          mode === m
                            ? "bg-surface text-text shadow-[0_4px_14px_rgba(141,75,44,0.10)]"
                            : "text-text-muted hover:text-text"
                        }`}
                      >
                        {m === "signin" ? "Sign in" : "Create account"}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.form
                      key={mode}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="mt-6"
                      onSubmit={(e) => e.preventDefault()}
                    >
                      {isSignup && (
                        <div className="mb-4">
                          <label htmlFor={nameId} className="mb-1.5 block text-sm font-medium text-text">
                            Full name
                          </label>
                          <input
                            id={nameId}
                            type="text"
                            autoComplete="name"
                            placeholder="Ananya Rao"
                            className={inputClass}
                          />
                        </div>
                      )}

                      <div className="mb-4">
                        <label htmlFor={emailId} className="mb-1.5 block text-sm font-medium text-text">
                          Work email
                        </label>
                        <input
                          id={emailId}
                          type="email"
                          autoComplete="email"
                          placeholder="you@firm.com"
                          className={inputClass}
                        />
                      </div>

                      <div className="mb-2">
                        <div className="mb-1.5 flex items-center justify-between">
                          <label htmlFor={passwordId} className="block text-sm font-medium text-text">
                            Password
                          </label>
                          {!isSignup && (
                            <a
                              href="#"
                              className="text-xs font-medium text-accent1 framer-transition hover:text-accent2"
                            >
                              Forgot password?
                            </a>
                          )}
                        </div>
                        <input
                          id={passwordId}
                          type="password"
                          autoComplete={isSignup ? "new-password" : "current-password"}
                          placeholder="••••••••"
                          className={inputClass}
                        />
                      </div>

                      {isSignup && (
                        <div className="mb-2">
                          <label htmlFor={confirmId} className="mb-1.5 block text-sm font-medium text-text">
                            Confirm password
                          </label>
                          <input
                            id={confirmId}
                            type="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            className={inputClass}
                          />
                        </div>
                      )}

                      <Button type="submit" size="lg" showArrow className="mt-4 w-full">
                        {isSignup ? "Create account" : "Sign in"}
                      </Button>

                      <div className="my-5 flex items-center gap-3 text-xs text-text-muted">
                        <span className="h-px flex-1 bg-border" />
                        or continue with
                        <span className="h-px flex-1 bg-border" />
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        className="w-full"
                        onClick={() => {}}
                      >
                        <Icon name="globe" size={18} />
                        Continue with SSO
                      </Button>

                      <p className="mt-5 text-center text-sm text-text-muted">
                        {isSignup ? (
                          <>
                            Already have an account?{" "}
                            <button
                              type="button"
                              onClick={() => setMode("signin")}
                              className="font-medium text-accent1 framer-transition hover:text-accent2"
                            >
                              Sign in
                            </button>
                          </>
                        ) : (
                          <>
                            New to Nyayantar?{" "}
                            <button
                              type="button"
                              onClick={() => setMode("signup")}
                              className="font-medium text-accent1 framer-transition hover:text-accent2"
                            >
                              Create an account
                            </button>
                          </>
                        )}
                      </p>
                    </motion.form>
                  </AnimatePresence>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
