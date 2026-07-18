"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

const BACKEND_BASE = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
).replace(/\/$/, "");

// Server-side consent enforcement (GDPR-style). When the backend has
// CONSENT_REQUIRED=true and the user hasn't granted consent, this blocks
// the workspace until they accept.
export function ConsentGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "ok" | "needed">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`${BACKEND_BASE}/consent/status`, {
      method: "GET",
      headers: { "X-Requested-With": "nyayantar" },
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : { required: false, granted: true }))
      .then((d) => {
        if (!active) return;
        setStatus(d.required && !d.granted ? "needed" : "ok");
      })
      .catch(() => active && setStatus("ok"));
    return () => {
      active = false;
    };
  }, []);

  const grant = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "nyayantar" },
        credentials: "include",
        body: JSON.stringify({ consent: true }),
      });
      if (res.ok) setStatus("ok");
    } finally {
      setBusy(false);
    }
  };

  if (status === "ok") return <>{children}</>;
  if (status === "loading") return null;

  return (
    <div className="flex h-[100dvh] items-center justify-center bg-page p-6">
      <div className="card-surface max-w-md p-8 text-center">
        <h2 className="text-xl font-semibold text-text">Consent required</h2>
        <p className="mt-3 text-sm leading-6 text-text-muted">
          Before using Nyayantar you must agree to our processing of your
          queries for legal research. See our Privacy and Terms.
        </p>
        <Button onClick={grant} disabled={busy} size="lg" className="mt-6 w-full">
          {busy ? "Saving…" : "I agree"}
        </Button>
      </div>
    </div>
  );
}
