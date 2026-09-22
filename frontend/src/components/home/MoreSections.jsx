import { MapPin, Phone, Star } from 'lucide-react';
import CtaLink from '../common/CtaLink.jsx';
import { DataBoundary, Skeleton } from '../common/DataState.jsx';
import Img from '../common/Img.jsx';
import Reveal from '../common/Reveal.jsx';
import SectionHeading from '../common/SectionHeading.jsx';
import SiteContainer from '../common/SiteContainer.jsx';
import HoursList from './HoursList.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { reviewApi } from '../../services/index.js';
import { iconFor } from '../../utils/icons.js';
import { buttonClass } from '../common/CtaLink.jsx';

export function AmbienceSection({ section }) {
  const [main, ...rest] = (section.images || []).filter((i) => i.secureUrl);
  if (!main) return null;
  return (
    <section className="py-24 sm:py-32">
      <SiteContainer>
        <Reveal className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading eyebrow={section.eyebrow} title={section.title} copy={section.copy} />
          <div>{(section.ctas || []).map((c, i) => <CtaLink key={i} cta={c} />)}</div>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <Reveal><div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-[var(--shadow-soft)] md:h-full md:min-h-[420px]"><Img src={main.secureUrl} alt={main.alt} fill sizes="(min-width:768px) 55vw, 95vw" /></div></Reveal>
          <div className="grid grid-cols-2 gap-4">
            {rest.slice(0, 3).map((im, i) => (
              <Reveal key={im.id} delay={0.08 * (i + 1)} className={i === 0 ? 'col-span-2' : ''}>
                <div className={`relative overflow-hidden rounded-[1.5rem] ${i === 0 ? 'aspect-[16/9]' : 'aspect-square'}`}><Img src={im.secureUrl} alt={im.alt} fill sizes="(min-width:768px) 22vw, 45vw" /></div>
              </Reveal>
            ))}
          </div>
        </div>
      </SiteContainer>
    </section>
  );
}

export function WhyChoose({ section }) {
  if (!section.items?.length) return null;
  return (
    <section className="border-y border-line bg-surface py-24 sm:py-32">
      <SiteContainer>
        <Reveal><SectionHeading eyebrow={section.eyebrow} title={section.title} copy={section.copy} /></Reveal>
        <ul className="mt-14 grid gap-px overflow-hidden rounded-[1.75rem] border border-line bg-line shadow-[var(--shadow-soft)] sm:grid-cols-2 lg:grid-cols-4">
          {section.items.map((it, i) => {
            const Icon = iconFor(it.icon);
            return (
              <li key={`${it.title}-${i}`} className="bg-surface p-7 transition-colors hover:bg-raised">
                <Icon className="size-6 text-accent" aria-hidden="true" />
                <p className="mt-10 font-display text-xl">{it.title}</p>
              </li>
            );
          })}
        </ul>
      </SiteContainer>
    </section>
  );
}

const Stars = ({ n }) => (
  <span className="flex" role="img" aria-label={`${n} out of 5 stars`}>
    {Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-4 ${i < n ? 'fill-accent text-accent' : 'text-fg/20'}`} aria-hidden="true" />)}
  </span>
);

export function ReviewsAndHours({ section }) {
  const { business, hours } = useSite();
  const { data, loading, error, reload } = useAsync(() => reviewApi.list(), []);
  const reviews = (data || []).slice(0, 3);
  return (
    <section id="reviews" className="scroll-mt-24 py-24 sm:py-32">
      <SiteContainer className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <div className="card-surface h-full p-8 sm:p-10">
            <p className="text-sm font-medium text-accent">{section.eyebrow}</p>
            <div className="mt-6 flex flex-wrap items-end gap-x-5 gap-y-2">
              <p className="font-display text-7xl leading-none">{business?.rating || '—'}</p>
              <div className="pb-1"><Stars n={Math.round(business?.rating || 0)} /><p className="mt-1 text-sm text-muted">{business?.reviewCount} Google reviews</p></div>
            </div>
            <DataBoundary loading={loading} error={error} onRetry={reload} compact skeleton={<Skeleton className="mt-8 h-24" />}>
              {reviews.length ? (
                <ul className="mt-8 grid gap-5">
                  {reviews.map((r) => (
                    <li key={r.id} className="border-t border-line pt-5">
                      <Stars n={r.rating} />
                      <blockquote className="mt-2 font-display text-xl leading-snug text-fg/90">“{r.text}”</blockquote>
                      <p className="mt-2 text-sm text-muted">{r.reviewerName}{r.source ? ` · ${r.source}` : ''}</p>
                    </li>
                  ))}
                </ul>
              ) : section.quote ? (
                <>
                  <p className="mt-8 font-display text-2xl leading-snug text-fg/90">{section.quote}</p>
                  {section.quoteNote ? <p className="mt-3 text-sm text-muted">{section.quoteNote}</p> : null}
                </>
              ) : null}
            </DataBoundary>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="h-full rounded-[1.75rem] border border-line bg-raised p-8 shadow-[var(--shadow-soft)] sm:p-10">
            <p className="text-sm font-medium text-accent">{section.tagline}</p>
            <h2 className="display mt-3 text-4xl">{section.title}</h2>
            <HoursList hours={hours} className="mt-6" />
            {hours?.badgeText ? <p className="mt-5 inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-ink">{hours.badgeText}</p> : null}
            {hours?.disclaimer ? <p className="mt-4 text-xs leading-5 text-muted">{hours.disclaimer}</p> : null}
          </div>
        </Reveal>
      </SiteContainer>
    </section>
  );
}

export function VisitSection({ section }) {
  const { business } = useSite();
  const img = section.images?.[0];
  return (
    <section id="visit" className="paper scroll-mt-24 bg-paper py-24 text-paper-ink sm:py-32">
      <SiteContainer className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <SectionHeading tone="paper" eyebrow={section.eyebrow} title={section.title} />
          {section.badge ? <p className="mt-6 inline-block rounded-full border border-paper-ink/25 bg-paper-ink/5 px-4 py-1.5 text-sm font-medium">{section.badge}</p> : null}
          <address className="mt-8 max-w-md text-lg not-italic leading-8 text-paper-muted">{business?.address}</address>
          <div className="mt-8 flex flex-wrap gap-3">
            {business?.links?.maps ? <a href={business.links.maps} target="_blank" rel="noreferrer noopener" className={buttonClass('primary')}><MapPin className="size-4" aria-hidden="true" /> Get directions</a> : null}
            {business?.phone ? <a href={`tel:${business.phone}`} className={buttonClass('secondary', 'paper')}><Phone className="size-4" aria-hidden="true" /> {business.displayPhone || 'Call'}</a> : null}
          </div>
        </Reveal>
        {img ? <Reveal delay={0.1}><div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] shadow-[var(--shadow-lift)]"><Img src={img.secureUrl} alt={img.alt} fill sizes="(min-width:1024px) 45vw, 95vw" /></div></Reveal> : null}
      </SiteContainer>
    </section>
  );
}

export function CtaSection({ section }) {
  const bg = section.images?.[0];
  return (
    <section className="paper grain relative isolate overflow-hidden bg-paper py-28 text-center text-paper-ink sm:py-40">
      {bg?.secureUrl ? <Img src={bg.secureUrl} alt="" fill className="-z-20" sizes="100vw" /> : null}
      <div className="absolute inset-0 -z-10 bg-paper/85" />
      <SiteContainer className="flex flex-col items-center">
        <SectionHeading tone="paper" align="center" eyebrow={section.eyebrow} title={section.title} copy={section.copy} />
        <div className="mt-10 flex flex-wrap justify-center gap-3">{(section.ctas || []).map((c, i) => <CtaLink key={i} cta={c} tone="paper" />)}</div>
      </SiteContainer>
    </section>
  );
}
