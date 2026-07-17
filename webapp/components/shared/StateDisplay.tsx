"use client";

import { type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

type StateCardProps = {
  icon: "search" | "doc" | "shield" | "scale" | "bolt" | "chart" | "users" | "lock" | "spark" | "layers" | "globe" | "brain";
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function StateCard({ icon, title, description, action, className = "" }: StateCardProps) {
  return (
    <div className={`card-surface mx-auto flex max-w-md flex-col items-center p-8 text-center ${className}`}>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-tint text-accent1">
        <Icon name={icon} size={26} />
      </span>
      <h3 className="mt-5 type-display-md text-text">{title}</h3>
      <p className="mt-2 type-body text-text-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

type EmptyStateProps = {
  title?: string;
  description?: string;
  icon?: StateCardProps["icon"];
  action?: ReactNode;
};

export function EmptyState({
  title = "Nothing here yet",
  description = "There are no items to display right now. Try adding something or check back later.",
  icon = "doc",
  action,
}: EmptyStateProps) {
  return (
    <StateCard icon={icon} title={title} description={description} action={action} />
  );
}

type ErrorStateProps = {
  title?: string;
  description?: string;
  icon?: StateCardProps["icon"];
  action?: ReactNode;
};

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load the requested content. Please try again or contact support if the issue persists.",
  icon = "shield",
  action,
}: ErrorStateProps) {
  return (
    <StateCard icon={icon} title={title} description={description} action={action} />
  );
}

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = "Loading…" }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-text-muted/60 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="h-2 w-2 rounded-full bg-text-muted/60 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="h-2 w-2 rounded-full bg-text-muted/60 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <p className="type-caption text-text-muted">{message}</p>
    </div>
  );
}

type RetryableErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function RetryableErrorState({
  title = "Connection failed",
  description = "Unable to reach the server. Please check your connection and try again.",
  onRetry,
  retryLabel = "Retry",
}: RetryableErrorStateProps) {
  return (
    <StateCard
      icon="shield"
      title={title}
      description={description}
      action={
        onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="primary-gradient inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white shadow-[0_12px_30px_rgba(249,115,22,0.20)] framer-transition hover:shadow-[0_16px_40px_rgba(249,115,22,0.28)] hover:-translate-y-0.5"
          >
            <Icon name="spark" size={16} />
            {retryLabel}
          </button>
        ) : undefined
      }
    />
  );
}
