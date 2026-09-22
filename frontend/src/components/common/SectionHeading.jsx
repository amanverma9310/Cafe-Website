import { cn } from '../../utils/cn.js';
import DisplayTitle from './DisplayTitle.jsx';

export default function SectionHeading({ eyebrow, title, copy, align = 'left', tone = 'dark', className }) {
  const paper = tone === 'paper';
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow ? (
        <p className={cn('mb-5 flex items-center gap-3 text-sm font-medium text-accent', align === 'center' && 'justify-center')}>
          <span aria-hidden="true" className="h-px w-8 bg-current opacity-70" />
          {eyebrow}
        </p>
      ) : null}
      <DisplayTitle title={title} className="text-[clamp(2.4rem,5.4vw,4.6rem)]" />
      {copy ? <p className={cn('mt-6 max-w-2xl text-base leading-7 sm:text-lg', paper ? 'text-paper-muted' : 'text-muted', align === 'center' && 'mx-auto')}>{copy}</p> : null}
    </div>
  );
}
