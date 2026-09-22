import CtaLink from '../common/CtaLink.jsx';
import Img from '../common/Img.jsx';
import Reveal from '../common/Reveal.jsx';
import SectionHeading from '../common/SectionHeading.jsx';
import SiteContainer from '../common/SiteContainer.jsx';

export default function AboutSection({ section }) {
  const [main, second] = section.images || [];
  return (
    <section className="py-24 sm:py-32">
      <SiteContainer className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        <Reveal>
          <SectionHeading eyebrow={section.eyebrow} title={section.title} copy={section.copy} />
          {section.highlights?.length ? (
            <ul className="mt-10 grid gap-6 sm:grid-cols-2">
              {section.highlights.map((h) => (
                <li key={h.title} className="border-t border-line pt-5">
                  <h3 className="font-display text-xl">{h.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{h.text}</p>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            {(section.ctas || []).map((c, i) => <CtaLink key={i} cta={c} />)}
            {section.tagline ? <p className="text-sm text-muted">{section.tagline}</p> : null}
          </div>
        </Reveal>

        <Reveal delay={0.1} className="relative mx-auto w-full max-w-xl">
          {main ? <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-[var(--shadow-lift)]"><Img src={main.secureUrl} alt={main.alt} fill sizes="(min-width:1024px) 40vw, 90vw" /></div> : null}
          {second ? (
            <div className="absolute -bottom-8 -left-6 hidden aspect-square w-[42%] overflow-hidden rounded-[1.5rem] border-[6px] border-base shadow-[var(--shadow-soft)] sm:block">
              <Img src={second.secureUrl} alt={second.alt} fill sizes="20vw" />
            </div>
          ) : null}
          {section.badge ? <span className="absolute right-4 top-4 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink shadow-[0_10px_24px_-12px_rgb(214_163_93/0.65)]">{section.badge}</span> : null}
        </Reveal>
      </SiteContainer>
    </section>
  );
}
