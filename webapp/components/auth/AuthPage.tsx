"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { GradientLabel } from "@/components/ui/GradientLabel";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/components/providers/AuthProvider";
import { EASE } from "@/lib/motion";
import { authBenefits, inputClass } from "@/lib/constants";

type PageMode = "login" | "register";

const copy = {
  login: {
    label: "Welcome back",
    title: "Sign in to your workspace.",
    sub: "Use your password to access your research workspace.",
    action: "Sign in",
    footnote: "New to Nyayantar?",
    footnoteAction: "Create an account",
    footnoteHref: "/register",
  },
  register: {
    label: "Create your account",
    title: "Start your free beta access.",
    sub: "Set up your workspace in under a minute and begin researching with citations you can trust.",
    action: "Create account",
    footnote: "Already have an account?",
    footnoteAction: "Sign in",
    footnoteHref: "/login",
  },
} as const;

function AuthCard({ mode }: { mode: PageMode }) {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const otpId = useId();

  const isRegister = mode === "register";
  const current = copy[mode];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const name = String(formData.get("name") || "").trim();

    if (isRegister) {
      const password = String(formData.get("password") || "");
      const confirm = String(formData.get("confirm") || "");

      if (!name || !email || !password) {
        setError("Please fill in your name, email, and password.");
        return;
      }

      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }

      const otpCode = String(formData.get("otp") || "").trim();
      if (!/^\d{6}$/.test(otpCode)) {
        setError("Enter the 6-digit OTP sent to your email.");
        return;
      }

      setError(null);
      setStatus(null);
      login({
        name,
        email,
      });
      router.push("/chat");
      return;
    }

    const password = String(formData.get("password") || "");
    if (!email || !password) {
      setError("Enter your work email and password.");
      return;
    }

    setError(null);
    setStatus(null);
    login({ email });
    router.push("/chat");
  };

  return (
    <div className="card-surface relative overflow-hidden p-6 md:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent1/8 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-accent2/8 blur-3xl" />

      <div className="relative">
        {status && (
          <div className="mt-4 rounded-2xl border border-accent1/20 bg-accent1/8 px-4 py-3 text-sm text-text">
            {status}
          </div>
        )}

        <motion.form
          key={mode}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="mt-6"
          onSubmit={handleSubmit}
        >
          {isRegister && (
            <div className="mb-4">
              <label htmlFor={nameId} className="mb-1.5 block text-sm font-medium text-text">
                Full name
              </label>
              <input
                id={nameId}
                name="name"
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
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@firm.com"
              className={inputClass}
            />
          </div>

          {!isRegister && (
            <div className="mb-2">
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor={passwordId} className="block text-sm font-medium text-text">
                  Password
                </label>
                <Link
                  href="/feedback"
                  className="text-xs font-medium text-accent1 framer-transition hover:text-accent2"
                >
                  Need help?
                </Link>
              </div>
              <input
                id={passwordId}
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
          )}

          {isRegister && (
            <>
              <div className="mb-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor={passwordId} className="block text-sm font-medium text-text">
                    Password
                  </label>
                  <Link
                    href="/feedback"
                    className="text-xs font-medium text-accent1 framer-transition hover:text-accent2"
                  >
                    Need help?
                  </Link>
                </div>
                <input
                  id={passwordId}
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>

              <div className="mb-2">
                <label htmlFor={confirmId} className="mb-1.5 block text-sm font-medium text-text">
                  Confirm password
                </label>
                <input
                  id={confirmId}
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>

              <div className="mb-2">
                <label htmlFor="register-otp" className="mb-1.5 block text-sm font-medium text-text">
                  OTP
                </label>
                <input
                  id="register-otp"
                  name="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className={`${inputClass} tracking-[0.35em] text-center text-base`}
                />
                <p className="mt-1.5 text-xs text-text-muted">
                  Enter the 6-digit code sent to your email.
                </p>
              </div>
            </>
          )}

          {error && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-col gap-3">
            <Button type="submit" size="lg" showArrow className="w-full">
              {isRegister ? current.action : "Sign in"}
            </Button>
          </div>

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
            onClick={() => {
              login();
              router.push("/chat");
            }}
          >
            <Icon name="globe" size={18} />
            Continue with SSO
          </Button>

          <p className="mt-5 text-center text-sm text-text-muted">
            {current.footnote}{" "}
            <Link
              href={current.footnoteHref}
              className="font-medium text-accent1 framer-transition hover:text-accent2"
            >
              {current.footnoteAction}
            </Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}

function AuthShell({
  mode,
}: {
  mode: PageMode;
}) {
  const current = copy[mode];

  return (
    <main className="page-bg min-h-[100dvh]">
      <div className="section-shell">
        <div className="section-container">
          <div className="content-container mx-auto px-4 py-5 md:px-10">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-2.5">
                <Logo />
                <span className="text-lg font-semibold tracking-tight-2">
                  Nyayantar
                  <span className="ml-1 rounded-md bg-surface-tint px-1.5 py-0.5 text-[10px] font-medium text-text-muted align-middle">
                    Beta
                  </span>
                </span>
              </Link>
              <div className="flex items-center gap-2">
                <Button href="/" variant="ghost" size="md">
                  Home
                </Button>
                <Button href="/chat" variant="secondary" size="md" showArrow>
                  Workspace
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="section-shell overflow-hidden py-8 md:py-12 lg:py-14">
        <div className="section-container">
          <div className="content-container mx-auto grid min-h-[calc(100dvh-120px)] items-center gap-12 px-4 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <Reveal>
              <GradientLabel>{current.label}</GradientLabel>
              <h1 className="mt-4 max-w-[560px] text-4xl font-semibold leading-[1.05] tracking-tight-3 sm:text-5xl lg:text-[62px]">
                {current.title}
              </h1>
              <p className="mt-5 max-w-[500px] text-lg leading-7 text-text-muted">
                {current.sub}
              </p>

              <ul className="mt-8 flex flex-col gap-3">
                {authBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3 text-sm text-text">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface-tint text-accent1">
                      <Icon name="check" size={13} />
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>

              <div className="mt-8 rounded-2xl border border-border bg-surface p-4">
                <p className="text-sm leading-6 text-text-muted">
                  Protected by enterprise-grade encryption. We never train on your
                  client data.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <AuthCard mode={mode} />
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}

export function AuthPage({ mode }: { mode: PageMode }) {
  return <AuthShell mode={mode} />;
}
