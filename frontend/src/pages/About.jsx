import { Link } from 'react-router-dom';
import Seo from '../components/common/Seo.jsx';
import { DataBoundary, Skeleton } from '../components/common/DataState.jsx';
import Img from '../components/common/Img.jsx';
import PageHero from '../components/common/PageHero.jsx';
import Reveal from '../components/common/Reveal.jsx';
import SectionHeading from '../components/common/SectionHeading.jsx';
import SiteContainer from '../components/common/SiteContainer.jsx';
import { buttonClass } from '../components/common/CtaLink.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { contentApi } from '../services/index.js';
import { iconFor } from '../utils/icons.js';

export default function About() {
  const hero = useAsync(() => contentApi.hero('about'), []);
  const about = useAsync(() => contentApi.about(), []);
  const a = about.data;
  return (
    <main id="main-content">
      <Seo title="About" path="/about" description={hero.data?.copy} image={hero.data?.image?.secureUrl} />
      <PageHero hero={hero.data} loading={hero.loading} />
      <SiteContainer className="py-24 sm:py-32">
        <DataBoundary loading={about.loading} error={about.error} onRetry={about.reload} skeleton={<Skeleton className="h-96" />}>
          {a ? (
            <>
              <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-24">
                <Reveal>
                  <SectionHeading title={a.storyTitle} copy={a.storyCopy} />
                  <Link to="/menu" className={`${buttonClass('primary')} mt-10`}>{a.ctaLabel || 'Explore the menu'}</Link>
                </Reveal>
                {a.storyImage?.secureUrl ? <Reveal delay={0.1}><div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-[var(--shadow-lift)]"><Img src={a.storyImage.secureUrl} alt={a.storyImage.alt} fill sizes="(min-width:1024px) 45vw, 95vw" /></div></Reveal> : null}
              </div>
              {a.pillars?.length ? (
                <div className="mt-28">
                  <Reveal><SectionHeading title={a.pillarsTitle} /></Reveal>
                  <ul className="mt-12 grid gap-px overflow-hidden rounded-[1.75rem] border border-line bg-line shadow-[var(--shadow-soft)] sm:grid-cols-2 lg:grid-cols-4">
                    {a.pillars.map((p) => { const Icon = iconFor(p.icon); return (
                      <li key={p.title} className="bg-surface p-8"><Icon className="size-6 text-accent" aria-hidden="true" /><h3 className="mt-10 font-display text-2xl">{p.title}</h3><p className="mt-3 text-sm leading-6 text-muted">{p.copy}</p></li>
                    ); })}
                  </ul>
                </div>
              ) : null}
              {a.note ? <p className="mt-10 max-w-2xl text-sm leading-6 text-muted">{a.note}</p> : null}
            </>
          ) : null}
        </DataBoundary>
      </SiteContainer>
    </main>
  );
}
