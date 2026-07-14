"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { GradientLabel } from "@/components/ui/GradientLabel";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/components/providers/AuthProvider";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { EASE } from "@/lib/motion";
import { inputClass } from "@/lib/constants";

export function WorkspaceSection() {
  const { loggedIn, login } = useAuth();

  return (
    <section id="workspace" className="section-shell py-14 md:py-[64px]">
      <div className="section-container">
        <div className="content-container mx-auto px-4 md:px-10">
          <Reveal className="max-w-title">
            <GradientLabel>
              {loggedIn ? "Your workspace" : "See it in action"}
            </GradientLabel>
            <h2 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight-2 sm:text-4xl">
              {loggedIn
                ? "Your research, drafted and cited."
                : "Sign in to your workspace."}
            </h2>
            <p className="mt-4 max-w-[440px] text-lg leading-7 text-text-muted">
              {loggedIn
                ? "Pick up right where you left off — your matters, drafts, and citations are exactly as you left them."
                : "One calm place for research, drafting, and review. Every answer traces back to a source you can verify."}
            </p>
          </Reveal>

          <div className="mt-10">
            <AnimatePresence mode="wait">
              {!loggedIn ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12"
                >
                  {/* Login card */}
                  <div className="card-surface relative mx-auto w-full max-w-[440px] overflow-hidden p-6 md:p-8">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent1/8 blur-3xl" />
                    <div className="relative">
                      <h3 className="text-xl font-semibold tracking-tight-2">
                        Welcome back
                      </h3>
                      <p className="mt-1.5 text-sm text-text-muted">
                        Sign in to open your workspace.
                      </p>

                      <form
                        className="mt-6"
                        onSubmit={(e) => {
                          e.preventDefault();
                          login();
                        }}
                      >
                        <div className="mb-4">
                          <label className="mb-1.5 block text-sm font-medium text-text">
                            Work email
                          </label>
                          <input
                            type="email"
                            autoComplete="email"
                            placeholder="you@firm.com"
                            className={inputClass}
                          />
                        </div>
                        <div className="mb-2">
                          <label className="mb-1.5 block text-sm font-medium text-text">
                            Password
                          </label>
                          <input
                            type="password"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            className={inputClass}
                          />
                        </div>

                        <Button type="submit" size="lg" showArrow className="mt-4 w-full">
                          Sign in
                        </Button>

                        <div className="my-5 flex items-center gap-3 text-xs text-text-muted">
                          <span className="h-px flex-1 bg-border" />
                          or
                          <span className="h-px flex-1 bg-border" />
                        </div>

                        <Button
                          type="button"
                          variant="secondary"
                          size="lg"
                          className="w-full"
                          onClick={() => login()}
                        >
                          <Icon name="globe" size={18} />
                          Continue with SSO
                        </Button>
                      </form>
                    </div>
                  </div>

                  {/* Chat preview */}
                  <div className="min-w-0">
                    <ChatWindow />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  <ChatWindow />
                  <div className="mt-5 flex justify-center">
                    <Button href="/chat" variant="secondary" size="md" showArrow>
                      Open full workspace
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
