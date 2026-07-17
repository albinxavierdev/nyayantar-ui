"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { GradientLabel } from "@/components/ui/GradientLabel";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function SettingsPage() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <>
      <Header />
      <main className="page-bg min-h-[100dvh]">
        <section className="section-shell overflow-hidden py-12 md:py-16">
          <div className="section-container">
            <div className="content-container mx-auto px-4 md:px-10">
              <Reveal className="max-w-3xl">
                <GradientLabel>Settings</GradientLabel>
                <h1 className="mt-4 text-4xl font-semibold leading-[1.06] tracking-tight-3 text-balance sm:text-5xl lg:text-[60px]">
                  Manage your workspace preferences.
                </h1>
                <p className="mt-5 max-w-3xl text-lg leading-7 text-text-muted">
                  Update your account settings, notification preferences, and workspace behavior here.
                </p>
              </Reveal>

              <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="card-surface p-6 md:p-8">
                  <div className="flex items-center gap-2 text-sm font-medium text-accent1">
                    <Icon name="settings" size={16} />
                    General settings
                  </div>

                  <div className="mt-6 space-y-5">
                    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-text">Email notifications</p>
                        <p className="text-xs text-text-muted">Receive product updates and research digests.</p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted hover:text-text"
                        aria-label="Toggle email notifications"
                      >
                        <span className="h-4 w-4 rounded-full bg-accent1" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-text">Compact citations</p>
                        <p className="text-xs text-text-muted">Show shorter citation chips in the chat.</p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted hover:text-text"
                        aria-label="Toggle compact citations"
                      >
                        <span className="h-4 w-4 rounded-full bg-border-strong" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-text">Auto-open sources</p>
                        <p className="text-xs text-text-muted">Open linked sources in a new tab automatically.</p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted hover:text-text"
                        aria-label="Toggle auto-open sources"
                      >
                        <span className="h-4 w-4 rounded-full bg-accent1" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="card-surface p-6">
                    <p className="text-sm font-medium text-accent1">Account</p>
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-text-muted">
                      <li className="flex gap-2">
                        <Icon name="check" size={16} className="mt-1 text-accent1" />
                        Signed in to Nyayantar Beta.
                      </li>
                      <li className="flex gap-2">
                        <Icon name="check" size={16} className="mt-1 text-accent1" />
                        Workspace data stays local-first.
                      </li>
                    </ul>
                  </div>

                  <div className="card-surface p-6">
                    <p className="text-sm font-medium text-accent1">Need to leave?</p>
                    <p className="mt-3 text-sm leading-6 text-text-muted">
                      Logging out will return you to the landing page. You can sign back in anytime.
                    </p>
                    <div className="mt-5 flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        className="w-full"
                        onClick={handleLogout}
                      >
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
