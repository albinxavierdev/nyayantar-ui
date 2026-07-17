import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

export default function Unauthorized() {
  return (
    <main className="page-bg flex min-h-[100dvh] flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-tint text-accent1">
          <Icon name="lock" size={36} />
        </div>

        <p className="type-caption inline-flex items-center gap-2 rounded-full border border-border bg-surface-tint px-3 py-1 font-medium text-text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent2" />
          Unauthorized
        </p>

        <h1 className="mt-5 type-display-lg text-text md:type-display-xl">
          401
        </h1>

        <p className="mt-4 type-body text-text-muted">
          You don&apos;t have permission to access this resource. Please sign in with an authorized account or contact your administrator.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/login" size="lg">
            Sign in
          </Button>
          <Button href="/" variant="secondary" size="lg">
            Back to home
          </Button>
        </div>
      </div>
    </main>
  );
}
