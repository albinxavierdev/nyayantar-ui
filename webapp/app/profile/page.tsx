"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { GradientLabel } from "@/components/ui/GradientLabel";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/components/providers/AuthProvider";
import { inputClass } from "@/lib/constants";
import { EASE } from "@/lib/motion";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
).replace(/\/$/, "");

function roleLabel(role: string): string {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "sudo_admin":
      return "Sudo Admin";
    case "admin":
      return "Admin";
    default:
      return "Member";
  }
}

function planLabel(plan: string | undefined): string {
  const p = (plan || "free").toLowerCase();
  if (p === "pro" || p === "professional") return "Professional";
  if (p === "enterprise") return "Enterprise";
  return "Free (Beta)";
}

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  // Redirect unauthenticated users to login (backend is the real gate).
  useEffect(() => {
    if (user === null) {
      router.replace("/login");
    } else if (user) {
      setName(user.name ?? "");
    }
  }, [user, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a display name.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Requested-With": "nyayantar" },
        credentials: "include",
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.detail || "Could not update your profile.");
        return;
      }
      const data = await res.json();
      const u = data?.user ?? {};
      updateUser({
        name: u.name ?? trimmed,
        plan: u.plan ?? user.plan,
        purchased: Boolean(u.purchased ?? user.purchased),
      });
      setMessage("Your profile has been updated.");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) return;
    setBuying(true);
    setBuyError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "nyayantar" },
        credentials: "include",
        body: JSON.stringify({ plan: "pro" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setBuyError(data?.detail || "Purchase could not be completed.");
        return;
      }
      const data = await res.json();
      const u = data?.user ?? {};
      updateUser({ purchased: true, plan: u.plan ?? "pro" });
    } catch {
      setBuyError("Could not reach the server. Please try again.");
    } finally {
      setBuying(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (!user) return null;

  const initials =
    (user.name || user.email)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p: string) => p[0]?.toUpperCase())
      .join("") || (user.email ? user.email[0]?.toUpperCase() : "U");

  return (
    <>
      <Header />
      <main className="page-bg min-h-[100dvh]">
        <section className="section-shell overflow-hidden py-12 md:py-16">
          <div className="section-container">
            <div className="content-container mx-auto px-4 md:px-10">
              <Reveal className="max-w-3xl">
                <GradientLabel>Profile</GradientLabel>
                <h1 className="mt-4 text-4xl font-semibold leading-[1.06] tracking-tight-3 text-balance sm:text-5xl lg:text-[60px]">
                  Your account.
                </h1>
                <p className="mt-5 max-w-3xl text-lg leading-7 text-text-muted">
                  Update your display name and review your account and purchase status.
                </p>
              </Reveal>

              <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_340px]">
                {/* Edit profile */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="card-surface p-6 md:p-8"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-accent1">
                    <Icon name="settings" size={16} />
                    Edit profile
                  </div>

                  <div className="mt-5 flex items-center gap-4">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full primary-gradient text-base font-semibold text-white">
                      {initials}
                    </span>
                    <div className="min-w-0 leading-tight">
                      <p className="truncate text-lg font-semibold text-text">
                        {user.name || "Unnamed account"}
                      </p>
                      <p className="truncate text-sm text-text-muted">{user.email}</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-6">
                    <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-text">
                      Display name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className={inputClass}
                    />

                    {error && (
                      <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                      </p>
                    )}
                    {message && (
                      <p className="mt-3 flex items-center gap-2 rounded-xl border border-accent1/20 bg-accent1/8 px-4 py-3 text-sm text-text">
                        <Icon name="check" size={14} className="text-accent1" />
                        {message}
                      </p>
                    )}

                    <div className="mt-5">
                      <Button type="submit" size="lg" disabled={saving}>
                        {saving ? "Saving…" : "Save changes"}
                      </Button>
                    </div>
                  </form>
                </motion.div>

                {/* Account + purchase status */}
                <div className="space-y-6">
                  <div className="card-surface p-6">
                    <p className="text-sm font-medium text-accent1">Account status</p>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <dt className="text-text-muted">Email</dt>
                        <dd className="truncate pl-3 font-medium text-text">{user.email}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-text-muted">Role</dt>
                        <dd className="font-medium text-text">{roleLabel(user.role)}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-text-muted">Plan</dt>
                        <dd className="font-medium text-text">{planLabel(user.plan)}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-text-muted">Status</dt>
                        <dd>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent1/10 px-2.5 py-1 text-xs font-medium text-accent1">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent1" />
                            Active
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="card-surface p-6">
                    <p className="text-sm font-medium text-accent1">Purchase status</p>
                    {user.purchased ? (
                      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-accent1/20 bg-accent1/8 px-4 py-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent1/15 text-accent1">
                          <Icon name="check" size={16} />
                        </span>
                        <div className="leading-tight">
                          <p className="text-sm font-semibold text-text">Purchased</p>
                          <p className="text-xs text-text-muted">
                            {planLabel(user.plan)} plan is active on this account.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-border-strong/30 text-text-muted">
                            <Icon name="lock" size={16} />
                          </span>
                          <div className="leading-tight">
                            <p className="text-sm font-semibold text-text">Not purchased</p>
                            <p className="text-xs text-text-muted">
                              This account is on the free beta plan.
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={handlePurchase}
                          disabled={buying}
                          showArrow
                          className="mt-4 w-full"
                        >
                          {buying ? "Processing…" : "Upgrade to Professional"}
                        </Button>
                        {buyError && (
                          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {buyError}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="card-surface p-6">
                    <p className="text-sm font-medium text-accent1">Session</p>
                    <p className="mt-3 text-sm leading-6 text-text-muted">
                      Logging out will return you to the landing page. You can sign back in anytime.
                    </p>
                    <div className="mt-5 flex flex-col gap-2">
                      <Button type="button" variant="secondary" size="md" className="w-full" onClick={handleLogout}>
                        Log out
                      </Button>
                      <Button href="/" size="md" className="w-full">
                        Back to landing page
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
