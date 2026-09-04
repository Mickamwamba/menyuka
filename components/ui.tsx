"use client";

import type { ReactNode } from "react";

export function Screen({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1 px-5 pt-4 pb-6">{children}</div>
      {footer ? (
        <div className="safe-bottom sticky bottom-0 border-t border-line bg-bg/95 px-5 pt-3 backdrop-blur">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-[1.6rem] leading-tight font-semibold tracking-tight text-balance">
      {children}
    </h1>
  );
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-[0.95rem] leading-snug text-muted">{children}</p>;
}

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "quiet";
  disabled?: boolean;
  type?: "button" | "submit";
};

// 56px min height: thumb-reachable one-handed, per M-13.
const BASE =
  "w-full min-h-14 rounded-2xl px-5 text-[1.05rem] font-medium transition active:scale-[0.99] disabled:opacity-40 disabled:active:scale-100";

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  type = "button",
}: ButtonProps) {
  const styles = {
    primary: "bg-accent text-white shadow-sm",
    secondary: "bg-surface text-ink border border-line",
    quiet: "text-muted underline underline-offset-4 min-h-12",
  }[variant];

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${BASE} ${styles}`}>
      {children}
    </button>
  );
}

/** Big tappable card — the shape used for fork options, answers, and dishes. */
export function Card({
  children,
  onClick,
  selected,
}: {
  children: ReactNode;
  onClick?: () => void;
  selected?: boolean;
}) {
  const className = `w-full rounded-2xl border bg-surface px-4 py-4 text-left transition ${
    selected ? "border-accent ring-2 ring-accent/20" : "border-line"
  } ${onClick ? "active:scale-[0.99] active:bg-accent-soft" : ""}`;

  if (!onClick) return <div className={className}>{children}</div>;
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export function TopBar({
  left,
  right,
}: {
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-5 flex min-h-10 items-center justify-between gap-3">
      <div className="min-w-0">{left}</div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}

export function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-ml-2 flex min-h-10 items-center gap-1 rounded-xl px-2 text-[0.95rem] text-muted"
    >
      <span aria-hidden>←</span>
      {label}
    </button>
  );
}

export function Spinner() {
  return (
    <span className="inline-block size-5 animate-spin rounded-full border-2 border-accent/25 border-t-accent" />
  );
}

export function ErrorNote({
  message,
  onRetry,
  retryLabel = "Try again",
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-accent/30 bg-accent-soft px-4 py-4">
      <p className="text-[0.95rem] text-accent-ink">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 min-h-10 font-medium text-accent underline underline-offset-4"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
