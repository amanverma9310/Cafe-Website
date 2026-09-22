import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export const Skeleton = ({ className }) => <div aria-hidden="true" className={cn('animate-shimmer rounded-md bg-raised', className)} />;

export function ErrorState({ error, onRetry, className, compact = false }) {
  return (
    <div role="alert" className={cn('flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface px-6 text-center', compact ? 'py-8' : 'py-14', className)}>
      <AlertCircle className="size-7 text-accent" aria-hidden="true" />
      <div>
        <p className="font-display text-xl text-fg">We couldn’t load this just now.</p>
        <p className="mt-1 text-sm text-muted">{error?.message || 'Please check your connection and try again.'}</p>
      </div>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-fg/30 px-5 text-sm font-semibold text-fg hover:bg-fg/10">
          <RefreshCw className="size-4" aria-hidden="true" /> Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyNote({ children, className }) {
  return <p className={cn('rounded-2xl border border-dashed border-line px-6 py-10 text-center text-muted', className)}>{children}</p>;
}

/** Wraps any API-backed block with consistent loading / error / empty handling. */
export function DataBoundary({ loading, error, onRetry, empty, emptyText, skeleton, children, compact }) {
  if (loading) return skeleton ?? <Skeleton className="h-40 w-full" />;
  if (error) return <ErrorState error={error} onRetry={onRetry} compact={compact} />;
  if (empty) return emptyText ? <EmptyNote>{emptyText}</EmptyNote> : null;
  return children;
}
