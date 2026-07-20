"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/components/providers/AuthProvider";

const preferences = [
  { id: "tone", label: "Response tone", description: "Choose how the assistant sounds.", options: ["Formal", "Balanced", "Concise"] },
  { id: "depth", label: "Research depth", description: "Control how thorough responses should be.", options: ["Quick", "Standard", "Deep"] },
  { id: "citations", label: "Citation style", description: "Preferred format for legal references.", options: ["Bluebook", "APA", "MLA", "None"] },
];

export default function PersonalizePage() {
  const { loggedIn, user } = useAuth();
  const [selected, setSelected] = useState<Record<string, string>>({
    tone: "Balanced",
    depth: "Standard",
    citations: "Bluebook",
  });

  // Not signed in: send the user to the full-screen pricing / free-trial page
  // instead of forcing a separate sign-in/register flow.
  if (!loggedIn) {
    return (
      <PageShell
        eyebrow="Personalize"
        title="Make Nyayantar yours."
        description="Sign in or start a free trial to save your preferences across devices."
      >
        <div className="card-surface flex flex-col items-center gap-4 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-tint text-accent1">
            <Icon name="spark" size={22} />
          </span>
          <p className="max-w-md text-sm leading-6 text-text-muted">
            Personalization is saved to your account. Start your free trial — no activation
            required — and your preferences will follow you everywhere.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/pricing" size="lg" showArrow>
              Start free trial
            </Button>
            <Button href="/pricing" variant="secondary" size="lg">
              See plans
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Personalize"
      title="Make Nyayantar yours."
      description={`Adjust tone, depth, and citation behavior, ${user?.name ? user.name.split(" ")[0] : "friend"}.`}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card-surface p-6 md:p-8">
          <div className="flex items-center gap-2 text-sm font-medium text-accent1">
            <Icon name="spark" size={16} />
            Preferences
          </div>

          <div className="mt-6 space-y-6">
            {preferences.map((pref) => (
              <div key={pref.id} className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-sm font-medium text-text">{pref.label}</p>
                <p className="text-xs text-text-muted">{pref.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {pref.options.map((option) => {
                    const isActive = selected[pref.id] === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSelected((s) => ({ ...s, [pref.id]: option }))}
                        className={`rounded-xl px-3 py-2 text-sm font-medium framer-transition ${
                          isActive
                            ? "bg-accent1 text-white"
                            : "border border-border bg-surface text-text-muted hover:text-text"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-surface p-6">
            <p className="text-sm font-medium text-accent1">Preview</p>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              Your preferences are applied locally for this session. Save them to your account to keep them across devices.
            </p>
            <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
              <p className="text-sm font-medium text-text">Current selection</p>
              <ul className="mt-2 space-y-1 text-sm text-text-muted">
                <li>Tone: {selected.tone}</li>
                <li>Depth: {selected.depth}</li>
                <li>Citations: {selected.citations}</li>
              </ul>
            </div>
            <Button size="md" showArrow className="mt-4 w-full">
              Save preferences
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
