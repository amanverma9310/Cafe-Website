import { cn } from '../../utils/cn.js';
import { hoursLabel } from '../../utils/format.js';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function HoursList({ hours, tone = 'dark', className }) {
  if (!hours?.days?.length) return null;
  const today = DAYS[(new Date().getDay() + 6) % 7];
  const paper = tone === 'paper';
  return (
    <dl className={cn('divide-y', paper ? 'divide-paper-ink/15' : 'divide-line', className)}>
      {hours.days.map((d) => (
        <div key={d.day} className={cn('flex items-center justify-between gap-4 py-3.5 text-[0.95rem]', d.day === today && (paper ? 'font-semibold text-paper-ink' : 'font-semibold text-fg'))}>
          <dt className="flex items-center gap-2">
            {d.day === today ? <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" /> : null}
            {d.day}
            {d.day === today ? <span className="sr-only"> (today)</span> : null}
          </dt>
          <dd className={cn(paper ? 'text-paper-muted' : 'text-muted', d.isClosed && 'italic')}>{hoursLabel(d)}</dd>
        </div>
      ))}
    </dl>
  );
}
