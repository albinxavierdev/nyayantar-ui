import { Logo } from "@/components/ui/Logo";

export default function Loading() {
  return (
    <main className="page-bg flex min-h-[100dvh] flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-5">
        <Logo />
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-text-muted/60 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 rounded-full bg-text-muted/60 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-2 w-2 rounded-full bg-text-muted/60 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <p className="type-caption text-text-muted">Loading workspace…</p>
      </div>
    </main>
  );
}
