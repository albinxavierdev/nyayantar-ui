"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { plans } from "@/lib/constants";

type AccountType = "individual" | "organization";

/**
 * Shared plans + payment panel. Used by both the global floating upgrade
 * window (modal) and the /pricing page so every surface shows identical
 * plans, pricing and the free-trial CTA.
 *
 * The "Free Trial" / "Start free" actions do not require activation — they
 * simply redirect to the dashboard (/chat). Account type (Individual /
 * Organization) is captured client-side and POSTed to the backend if a
 * session exists.
 */
export function PlansPanel({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const startFreeTrial = () => {
    // Persist account-type preference if logged in (best-effort; ignored if not).
    try {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/auth/me`, {
        method: "GET",
        headers: { "X-Requested-With": "nyayantar" },
        credentials: "include",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.authenticated) {
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/auth/account-type`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Requested-With": "nyayantar" },
              credentials: "include",
              body: JSON.stringify({ account_type: accountType }),
            }).catch(() => {});
          }
        })
        .catch(() => {});
    } catch {
      /* no-op */
    }
    // Open the full-screen pricing page (no popup/modal).
    router.push("/pricing");
  };

  return (
    <div>
      {/* Account type toggle */}
      <div className="mb-5 flex items-center justify-center gap-2">
        {(["individual", "organization"] as const).map((type) => {
          const active = accountType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setAccountType(type)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium framer-transition ${
                active
                  ? "bg-accent1 text-white"
                  : "border border-border bg-surface text-text-muted hover:text-text"
              }`}
            >
              <Icon name={type === "individual" ? "users" : "layers"} size={15} />
              {type === "individual" ? "Individual" : "Organization"}
            </button>
          );
        })}
      </div>

      {/* Billing toggle */}
      <div className="mb-6 flex items-center justify-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => setBilling("monthly")}
          className={billing === "monthly" ? "font-semibold text-text" : "text-text-muted"}
        >
          Monthly
        </button>
        <span className="h-4 w-px bg-border" />
        <button
          type="button"
          onClick={() => setBilling("annual")}
          className={billing === "annual" ? "font-semibold text-text" : "text-text-muted"}
        >
          Annual
        </button>
        <span className="rounded-full bg-accent1/10 px-2 py-0.5 text-xs font-medium text-accent1">
          Save 20%
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const price = billing === "monthly" ? plan.monthly : plan.annual;
          const isFree = price === 0;
          return (
            <div
              key={plan.name}
              className={`card-surface flex flex-col p-5 ${
                plan.highlight ? "ring-2 ring-accent1/40" : ""
              }`}
            >
              <p className="text-sm font-medium text-accent1">{plan.name}</p>
              <p className="mt-1 text-xs text-text-muted">{plan.description}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight-2 text-text">
                {isFree ? (plan.name === "Enterprise" ? "Custom" : "Free") : `$${price}`}
                {!isFree && <span className="text-base font-medium text-text-muted">/mo</span>}
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-text-muted">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Icon name="check" size={14} className="mt-0.5 shrink-0 text-accent1" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={startFreeTrial}
                className={`mt-5 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-medium framer-transition ${
                  plan.highlight
                    ? "primary-gradient text-white hover:-translate-y-0.5"
                    : "border border-border bg-surface text-text hover:border-text/30"
                }`}
              >
                {plan.name === "Enterprise" ? "Contact sales" : "Free Trial"}
                <Icon name="arrow" size={15} className="ml-1.5" />
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-text-muted">
        No activation required — your free trial starts the moment you open the workspace.
      </p>
      {onClose && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-text-muted underline-offset-4 hover:text-text hover:underline"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
