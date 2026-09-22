import { Dialog as D } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export const Sheet = D.Root;
export const SheetTrigger = D.Trigger;
export const SheetClose = D.Close;
export const SheetTitle = D.Title;
export const SheetDescription = D.Description;
export function SheetContent({ className, children, ...p }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <D.Content
        className={cn('fixed inset-y-0 right-0 z-50 flex h-full w-[min(88vw,420px)] flex-col shadow-2xl data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right', className)}
        {...p}
      >
        {children}
        <D.Close className="absolute right-4 top-4 grid size-10 place-items-center rounded-full text-current opacity-80 hover:opacity-100" aria-label="Close menu">
          <X className="size-5" aria-hidden="true" />
        </D.Close>
      </D.Content>
    </D.Portal>
  );
}
