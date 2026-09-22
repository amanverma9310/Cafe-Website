import { Tabs as T } from 'radix-ui';
import { cn } from '../../utils/cn.js';

export const Tabs = ({ className, ...p }) => <T.Root className={cn('flex flex-col gap-2', className)} {...p} />;
export const TabsList = ({ className, ...p }) => <T.List className={cn('inline-flex w-fit items-center gap-1 bg-transparent', className)} {...p} />;
export const TabsTrigger = ({ className, ...p }) => (
  <T.Trigger
    className={cn(
      'relative inline-flex min-h-11 items-center justify-center whitespace-nowrap px-1 text-base font-medium text-fg/55 transition-colors hover:text-fg data-[state=active]:text-fg',
      "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-accent after:opacity-0 after:transition-opacity data-[state=active]:after:opacity-100",
      className,
    )}
    {...p}
  />
);
export const TabsContent = ({ className, ...p }) => <T.Content className={cn('flex-1 outline-none', className)} {...p} />;
