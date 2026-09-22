import { useState } from 'react';
import { AlertDialog, Dialog } from 'radix-ui';
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, Search, X } from 'lucide-react';
import { cn } from '../../../utils/cn.js';
import { notifyError } from '../../../utils/errors.js';

export const inputCls = 'block min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3.5 text-[0.95rem] text-stone-900 placeholder:text-stone-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 aria-[invalid=true]:border-red-500 disabled:bg-stone-100';

export function Button({ variant = 'primary', size = 'md', loading = false, className, children, disabled, type = 'button', ...p }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-55',
        size === 'sm' ? 'min-h-9 px-3 text-sm' : 'min-h-11 px-5 text-sm',
        variant === 'primary' && 'bg-emerald-800 text-white hover:bg-emerald-900',
        variant === 'secondary' && 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-100',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        variant === 'ghost' && 'text-stone-700 hover:bg-stone-200/70',
        className,
      )}
      {...p}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export const IconButton = ({ label, className, children, ...p }) => (
  <button type="button" aria-label={label} title={label} className={cn('grid size-9 place-items-center rounded-lg text-stone-600 transition hover:bg-stone-200/70 hover:text-stone-900 disabled:opacity-40', className)} {...p}>{children}</button>
);

export const Card = ({ className, children, ...p }) => <div className={cn('rounded-xl border border-stone-200 bg-white shadow-sm', className)} {...p}>{children}</div>;

const badgeTone = { neutral: 'bg-stone-100 text-stone-700', green: 'bg-emerald-100 text-emerald-800', amber: 'bg-amber-100 text-amber-800', red: 'bg-red-100 text-red-700', blue: 'bg-sky-100 text-sky-800' };
export const Badge = ({ tone = 'neutral', className, children }) => <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', badgeTone[tone], className)}>{children}</span>;

export function Field({ label, htmlFor, error, hint, required, children, className }) {
  return (
    <div className={className}>
      {label ? <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-stone-800">{label}{required ? <span className="text-red-600" aria-hidden="true"> *</span> : null}</label> : null}
      {children}
      {hint && !error ? <p className="mt-1.5 text-xs text-stone-500">{hint}</p> : null}
      {error ? <p role="alert" className="mt-1.5 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export function Switch({ checked, onChange, label, disabled, className }) {
  return (
    <button type="button" role="switch" aria-checked={!!checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50', checked ? 'bg-emerald-700' : 'bg-stone-300', className)}>
      <span className={cn('inline-block size-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
  );
}

export function SwitchField({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-stone-200 px-4 py-3">
      <div><p className="text-sm font-medium text-stone-800">{label}</p>{hint ? <p className="mt-0.5 text-xs text-stone-500">{hint}</p> : null}</div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

export const Spinner = ({ className }) => <Loader2 className={cn('size-5 animate-spin text-stone-400', className)} aria-label="Loading" />;
export const Loading = ({ label = 'Loading…' }) => <div className="grid place-items-center gap-3 py-20 text-sm text-stone-500" role="status"><Spinner className="size-7" />{label}</div>;

export function ErrorPanel({ error, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <AlertCircle className="size-7 text-red-600" aria-hidden="true" />
      <p className="max-w-md text-sm text-red-800">{error?.message || 'Something went wrong.'}</p>
      {onRetry ? <Button variant="secondary" size="sm" onClick={() => onRetry()}>Try again</Button> : null}
    </div>
  );
}

export const EmptyState = ({ title, children, action }) => (
  <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
    <p className="font-semibold text-stone-800">{title}</p>
    {children ? <p className="mx-auto mt-1 max-w-md text-sm text-stone-500">{children}</p> : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);

export const PageHeader = ({ title, description, actions }) => (
  <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
    <div><h1 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h1>{description ? <p className="mt-1 max-w-2xl text-sm text-stone-600">{description}</p> : null}</div>
    {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
  </div>
);

export function SearchInput({ value, onChange, placeholder = 'Search…', className }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className={cn(inputCls, 'pl-9')} />
    </div>
  );
}

export function Pagination({ meta, onPage }) {
  if (!meta || meta.pages <= 1) return null;
  return (
    <nav className="mt-6 flex items-center justify-between gap-3 text-sm text-stone-600" aria-label="Pagination">
      <span>Page {meta.page} of {meta.pages} · {meta.total} total</span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}><ChevronLeft className="size-4" aria-hidden="true" /> Previous</Button>
        <Button variant="secondary" size="sm" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>Next <ChevronRight className="size-4" aria-hidden="true" /></Button>
      </div>
    </nav>
  );
}

const sizes = { md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
export function Modal({ open, onOpenChange, title, description, size = 'md', children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-stone-900/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className={cn('admin-ui fixed left-1/2 top-1/2 z-50 flex max-h-[92svh] w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white text-stone-900 shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95', sizes[size])}>
          <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-6 py-4">
            <div><Dialog.Title className="text-lg font-bold">{title}</Dialog.Title>{description ? <Dialog.Description className="mt-0.5 text-sm text-stone-500">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}</div>
            <Dialog.Close className="grid size-9 shrink-0 place-items-center rounded-lg text-stone-500 hover:bg-stone-100" aria-label="Close"><X className="size-5" aria-hidden="true" /></Dialog.Close>
          </div>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const ModalFooter = ({ children }) => <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-stone-200 pt-4">{children}</div>;

/** Confirmation for destructive actions. `onConfirm` may be async; failures are toasted and the dialog stays open. */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Delete', danger = true, onConfirm, children }) {
  const [busy, setBusy] = useState(false);
  const run = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await onConfirm(); onOpenChange(false); } catch (err) { notifyError(err); } finally { setBusy(false); }
  };
  return (
    <AlertDialog.Root open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-stone-900/50" />
        <AlertDialog.Content className="admin-ui fixed left-1/2 top-1/2 z-[60] w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 text-stone-900 shadow-2xl">
          <AlertDialog.Title className="text-lg font-bold">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-6 text-stone-600">{description}</AlertDialog.Description>
          {children}
          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Cancel asChild><Button variant="secondary" disabled={busy}>Cancel</Button></AlertDialog.Cancel>
            <AlertDialog.Action asChild><Button variant={danger ? 'danger' : 'primary'} loading={busy} onClick={run}>{confirmLabel}</Button></AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export function ProgressBar({ value }) {
  if (value == null) return null;
  return (
    <div className="mt-3" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
      <div className="h-2 overflow-hidden rounded-full bg-stone-200"><div className="h-full bg-emerald-700 transition-all" style={{ width: `${value}%` }} /></div>
      <p className="mt-1 text-xs text-stone-500">{value < 100 ? `Uploading… ${value}%` : 'Processing…'}</p>
    </div>
  );
}

export const applyServerErrors = (err, setError) => {
  if (err?.details) Object.entries(err.details).forEach(([k, m]) => typeof m === 'string' && setError(k, { message: m }));
};
