import { MapPin, Phone } from 'lucide-react';
import Seo from '../components/common/Seo.jsx';
import PageHero from '../components/common/PageHero.jsx';
import Img from '../components/common/Img.jsx';
import Reveal from '../components/common/Reveal.jsx';
import SectionHeading from '../components/common/SectionHeading.jsx';
import SiteContainer from '../components/common/SiteContainer.jsx';
import { buttonClass } from '../components/common/CtaLink.jsx';
import ContactForm from '../components/contact/ContactForm.jsx';
import HoursList from '../components/home/HoursList.jsx';
import { useSite } from '../context/SiteContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { contentApi } from '../services/index.js';

export default function Contact() {
  const { business, hours } = useSite();
  const hero = useAsync(() => contentApi.hero('contact'), []);
  const side = hero.data?.secondaryImage?.secureUrl || hero.data?.image?.secureUrl;
  return (
    <main id="main-content">
      <Seo title="Contact & Visit" path="/contact" description={hero.data?.copy} image={hero.data?.image?.secureUrl} />
      <PageHero hero={hero.data} loading={hero.loading} />

      <section id="visit" className="scroll-mt-24 py-20 sm:py-28">
        <SiteContainer className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <Reveal>
            <SectionHeading eyebrow="Location" title={`${business?.shortAddress || 'Find us'}.`} copy={business?.address} />
            <div className="mt-8 flex flex-wrap gap-3">
              {business?.links?.maps ? <a href={business.links.maps} target="_blank" rel="noreferrer noopener" className={buttonClass('primary')}><MapPin className="size-4" aria-hidden="true" /> Get directions</a> : null}
              {business?.phone ? <a href={`tel:${business.phone}`} className={buttonClass('secondary')}><Phone className="size-4" aria-hidden="true" /> {business.displayPhone || 'Call'}</a> : null}
            </div>
            {business?.plusCode ? <p className="mt-6 text-sm text-muted">Plus code: {business.plusCode}</p> : null}
            {side ? <div className="relative mt-10 aspect-[16/10] overflow-hidden rounded-[1.75rem] shadow-[var(--shadow-soft)]"><Img src={side} alt={hero.data?.secondaryImage?.alt || hero.data?.image?.alt} fill sizes="(min-width:1024px) 50vw, 95vw" /></div> : null}
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card-surface p-8 sm:p-10">
              <h2 className="display text-4xl">Opening <em>hours</em></h2>
              <HoursList hours={hours} className="mt-6" />
              {hours?.badgeText ? <p className="mt-5 inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-ink">{hours.badgeText}</p> : null}
              {hours?.disclaimer ? <p className="mt-4 text-xs leading-5 text-muted">{hours.disclaimer}</p> : null}
            </div>
          </Reveal>
        </SiteContainer>
      </section>

      <section id="enquiry" className="scroll-mt-24 border-t border-line bg-surface py-20 sm:py-28">
        <SiteContainer className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <SectionHeading eyebrow="Enquiries & reservations" title="Tell us what you’re planning." copy="For the fastest reply, call the cafe. Or send an enquiry here and the team will get back to you." />
            {business?.reservationInfo ? <p className="mt-6 text-sm leading-6 text-muted">{business.reservationInfo}</p> : null}
          </Reveal>
          <Reveal delay={0.1}><ContactForm /></Reveal>
        </SiteContainer>
      </section>
    </main>
  );
}
