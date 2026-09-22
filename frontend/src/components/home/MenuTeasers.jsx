import { Link } from 'react-router-dom';
import { ArrowUpRight, FileText } from 'lucide-react';
import CtaLink from '../common/CtaLink.jsx';
import { DataBoundary, Skeleton } from '../common/DataState.jsx';
import Img from '../common/Img.jsx';
import Reveal from '../common/Reveal.jsx';
import SectionHeading from '../common/SectionHeading.jsx';
import SiteContainer from '../common/SiteContainer.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { menuApi } from '../../services/index.js';
import { formatPrice } from '../../utils/format.js';
import { mediaSrc } from '../../utils/media.js';

export function FeaturedMenu({ section }) {
  const { business } = useSite();
  const { data, loading, error, reload } = useAsync(() => menuApi.items({ featured: true, menu: 'main' }), []);
  const items = data?.items?.slice(0, 8) || [];
  if (!loading && !error && !items.length) return null;
  return (
    <section className="border-y border-line bg-surface py-24 sm:py-32">
      <SiteContainer>
        <Reveal className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading eyebrow={section.eyebrow} title={section.title} copy={section.copy} />
          <div className="flex gap-3">{(section.ctas || []).map((c, i) => <CtaLink key={i} cta={c} />)}</div>
        </Reveal>
        <div className="mt-14">
          <DataBoundary loading={loading} error={error} onRetry={reload} skeleton={<div className="grid gap-x-16 gap-y-8 md:grid-cols-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-16" />)}</div>}>
            <ul className="grid gap-x-16 gap-y-9 md:grid-cols-2">
              {items.map((it) => (
                <li key={it.id}>
                  <div className="flex items-baseline gap-3">
                    <h3 className="font-display text-2xl">{it.name}</h3>
                    <span aria-hidden="true" className="-translate-y-1 flex-1 border-b border-dotted border-fg/25" />
                    <span className="tabular-nums text-accent">{formatPrice(it.price, business?.currencySymbol)}</span>
                  </div>
                  {it.description ? <p className="mt-1.5 max-w-md text-sm leading-6 text-muted">{it.description}</p> : null}
                </li>
              ))}
            </ul>
          </DataBoundary>
        </div>
      </SiteContainer>
    </section>
  );
}

export function DietaryMenus({ section }) {
  const { data, loading, error, reload } = useAsync(() => menuApi.documents(), []);
  const docs = (data || []).filter((d) => d.type === 'dietary');
  if (!loading && !error && !docs.length) return null;
  return (
    <section className="py-24 sm:py-32">
      <SiteContainer>
        <Reveal><SectionHeading eyebrow={section.eyebrow} title={section.title} copy={section.copy} /></Reveal>
        <div className="mt-14">
          <DataBoundary loading={loading} error={error} onRetry={reload} skeleton={<div className="grid gap-6 md:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>}>
            <div className="grid gap-6 md:grid-cols-2">
              {docs.map((d, i) => (
                <Reveal key={d.id} delay={i * 0.08}>
                  <article className="card-surface flex h-full gap-6 p-6 sm:p-8">
                    {d.cover?.secureUrl ? <div className="relative hidden aspect-[4/5] w-32 shrink-0 overflow-hidden rounded-xl sm:block"><Img src={d.cover.secureUrl} alt={d.cover.alt} fill sizes="130px" /></div> : null}
                    <div className="flex flex-1 flex-col">
                      <h3 className="font-display text-3xl">{d.title}</h3>
                      <p className="mt-3 flex-1 text-sm leading-6 text-muted">{d.description}</p>
                      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
                        <Link to={`/menu?tab=${d.key}`} className="inline-flex items-center gap-1 text-accent hover:underline">View dishes <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
                        {d.pdf?.secureUrl ? <a href={mediaSrc(d.pdf.secureUrl)} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-fg/80 hover:text-fg"><FileText className="size-4" aria-hidden="true" /> PDF</a> : null}
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </DataBoundary>
          {section.note ? <p className="mt-8 max-w-2xl text-sm leading-6 text-muted">{section.note}</p> : null}
          <div className="mt-6">{(section.ctas || []).map((c, i) => <CtaLink key={i} cta={c} />)}</div>
        </div>
      </SiteContainer>
    </section>
  );
}
