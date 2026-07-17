"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global route error:", error);
  }, [error]);

  const isBackendError = error.message?.toLowerCase().includes("fetch") ||
    error.message?.toLowerCase().includes("network") ||
    error.message?.toLowerCase().includes("failed to fetch") ||
    error.message?.toLowerCase().includes("econnreset") ||
    error.message?.toLowerCase().includes("enotfound");

  return (
    <main className="page-bg flex min-h-[100dvh] flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-tint text-accent1">
          <Icon name="shield" size={36} />
        </div>

        <p className="type-caption inline-flex items-center gap-2 rounded-full border border-border bg-surface-tint px-3 py-1 font-medium text-text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-fire-brick animate-pulse" />
          {isBackendError ? "Server unreachable" : "Application error"}
        </p>

        <h1 className="mt-5 type-display-lg text-text md:type-display-xl">
          {isBackendError ? "Can't reach the server" : "Something broke"}
        </h1>

        <p className="mt-4 type-body text-text-muted">
          {isBackendError
            ? "The backend service is not responding. It may be offline or unreachable. Please check the server and try again."
            : "An unexpected error occurred while loading this page. Our team has been notified."}
        </p>

        {error.digest && (
          <p className="mt-2 text-xs text-text-muted/70 font-mono">
            Ref: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset} size="lg">
            Try again
          </Button>
          <Button href="/" variant="secondary" size="lg">
            Back to home
          </Button>
        </div>
      </div>
    </main>
  );
}
