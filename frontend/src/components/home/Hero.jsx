import { useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Pause, Play, Star } from 'lucide-react';
import CtaLink from '../common/CtaLink.jsx';
import DisplayTitle from '../common/DisplayTitle.jsx';
import Img from '../common/Img.jsx';
import { Skeleton } from '../common/DataState.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { mediaSrc, videoPoster } from '../../utils/media.js';

/** Home hero. If the owner uploaded a hero video it plays muted behind the text; otherwise the photo is used. */
export default function Hero({ hero, loading }) {
  const { business, hours } = useSite();
  const reduce = useReducedMotion();
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);

  if (loading) return <div className="min-h-[calc(100svh-76px)] bg-paper p-10"><Skeleton className="mt-56 h-28 w-2/3 bg-paper-ink/10" /></div>;
  if (!hero) return null;
  const video = hero.video?.secureUrl;
  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  return (
    <section className="paper grain relative isolate flex min-h-[calc(100svh-76px)] flex-col overflow-hidden bg-paper text-paper-ink">
      <Img src={hero.image?.secureUrl} alt={video ? '' : hero.image?.alt} fill priority sizes="100vw" className="-z-20" />
      {video && !reduce ? (
        <video
          ref={videoRef}
          className="absolute inset-0 -z-10 size-full object-cover"
          src={mediaSrc(video)}
          poster={videoPoster(video) || undefined}
          autoPlay muted loop playsInline preload="metadata" aria-hidden="true"
        />
      ) : null}
      {/* Deep-forest wash over the photo: strong enough for cream text to sit comfortably, restrained enough to stay immersive rather than gloomy. */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(105deg,rgba(22,33,23,.86)_0%,rgba(22,33,23,.58)_46%,rgba(22,33,23,.18)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-t from-paper via-paper/65 to-transparent" />

      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-5 pb-10 pt-8 sm:px-8 lg:px-12">
        <div className="hero-reveal flex flex-wrap justify-between gap-2 text-xs font-medium text-paper-ink/75 sm:text-sm">
          <span>{hero.topLeft}</span><span>{hero.topRight}</span>
        </div>

        <div className="flex flex-1 items-center py-14">
          <div className="max-w-4xl">
            {hero.eyebrow ? <p className="hero-reveal mb-6 flex items-center gap-3 text-sm font-medium text-accent"><span aria-hidden="true" className="h-px w-10 bg-accent" />{hero.eyebrow}</p> : null}
            <DisplayTitle as="h1" title={hero.title} className="hero-reveal hero-delay-1 text-[clamp(3.5rem,10.5vw,9.5rem)] leading-[0.9]" />
            {hero.copy ? <p className="hero-reveal hero-delay-2 mt-8 max-w-xl text-base leading-7 text-paper-ink/85 sm:text-lg">{hero.copy}</p> : null}
            <div className="hero-reveal hero-delay-3 mt-10 flex flex-wrap items-center gap-3">
              {(hero.ctas || []).map((cta, i) => <CtaLink key={`${cta.label}-${i}`} cta={cta} tone="paper" />)}
            </div>
          </div>
        </div>

        {hero.showStats !== false && business ? (
          <dl className="hero-reveal hero-delay-3 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-paper-ink/20 pt-6 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-paper-muted">Google rating</dt>
              <dd className="mt-1 flex items-center gap-2 font-display text-3xl"><Star className="size-5 fill-accent text-accent" aria-hidden="true" />{business.rating || '—'}<span className="font-sans text-sm text-paper-muted">({business.reviewCount})</span></dd>
            </div>
            <div><dt className="text-xs text-paper-muted">Typical spend</dt><dd className="mt-1 font-display text-2xl">{business.spend}</dd></div>
            <div><dt className="text-xs text-paper-muted">Cuisine</dt><dd className="mt-1 font-display text-2xl">{business.category?.split('/')[0]?.trim()}</dd></div>
            <div><dt className="text-xs text-paper-muted">Hours</dt><dd className="mt-1 font-display text-2xl">{hours?.badgeText || 'See below'}</dd></div>
          </dl>
        ) : null}
      </div>

      {video && !reduce ? (
        <button type="button" onClick={toggle} aria-label={playing ? 'Pause background video' : 'Play background video'} className="absolute right-5 top-5 grid size-11 place-items-center rounded-full border border-paper-ink/25 bg-paper/50 text-paper-ink backdrop-blur hover:bg-paper/75 sm:right-8">
          {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
        </button>
      ) : null}
    </section>
  );
}
