import DisplayTitle from './DisplayTitle.jsx';
import Img from './Img.jsx';
import { Skeleton } from './DataState.jsx';

/** Banner for inner pages. `hero` comes from the CMS (Hero with page key). */
export default function PageHero({ hero, loading }) {
  if (loading) return <div className="min-h-[480px] bg-paper p-8"><Skeleton className="mt-40 h-24 w-2/3 bg-paper-ink/10" /></div>;
  if (!hero) return null;
  return (
    <section className="paper grain relative isolate min-h-[500px] overflow-hidden bg-paper text-paper-ink sm:min-h-[580px]">
      <Img src={hero.image?.secureUrl} alt={hero.image?.alt} fill priority sizes="100vw" className="-z-20" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(95deg,rgba(22,33,23,.88)_0%,rgba(22,33,23,.6)_52%,rgba(22,33,23,.2)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-paper to-transparent" />
      <div className="mx-auto flex min-h-[500px] max-w-[1440px] items-end px-5 pb-16 pt-24 sm:min-h-[580px] sm:px-8 sm:pb-20 lg:px-12">
        <div className="max-w-3xl">
          {hero.eyebrow ? <p className="hero-reveal mb-5 text-sm font-medium text-accent">{hero.eyebrow}</p> : null}
          <DisplayTitle as="h1" title={hero.title} className="hero-reveal hero-delay-1 text-[clamp(3.2rem,8vw,6.8rem)] leading-[0.92]" />
          {hero.copy ? <p className="hero-reveal hero-delay-2 mt-7 max-w-2xl text-base leading-7 text-paper-ink/85 sm:text-lg">{hero.copy}</p> : null}
        </div>
      </div>
    </section>
  );
}
