import { Inbox, AlertTriangle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";

export function EmptyState({
  title = "Nothing here yet",
  description = "Data will appear once your sources are connected.",
  className,
  action,
}: {
  title?: string;
  description?: string;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-900">
        <Inbox className="h-5 w-5" />
      </span>
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h4>
      <p className="max-w-sm text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "We could not load this section. Please try again.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center dark:border-red-900 dark:bg-red-950/40",
        className,
      )}
    >
      <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <h4 className="text-sm font-semibold text-red-900 dark:text-red-100">{title}</h4>
      <p className="max-w-sm text-xs text-red-700 dark:text-red-300">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-6 py-12 text-center",
        className,
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}
