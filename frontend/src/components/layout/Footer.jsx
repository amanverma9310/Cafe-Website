import { Link } from 'react-router-dom';
import { ArrowUpRight, Globe, MapPin, Phone, Sprout } from 'lucide-react';
import { navigation } from '../../config/navigation.js';
import { useSite } from '../../context/SiteContext.jsx';

export default function Footer() {
  const { business, settings } = useSite();
  const links = business?.links || {};
  const socials = [links.instagram && ['Instagram', links.instagram], links.facebook && ['Facebook', links.facebook], ...(links.other || []).map((o) => [o.label, o.url])].filter(Boolean);
  const addressLines = business?.address ? business.address.split(/,\s*(?=Greater Kailash II,|New Delhi)/) : [];

  return (
    <footer className="paper border-t border-paper-ink/10 bg-paper pb-28 pt-16 text-paper-ink lg:pb-10">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr] lg:px-12">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-accent text-accent-ink"><Sprout className="size-5" aria-hidden="true" /></span>
            <p className="font-display text-3xl uppercase tracking-[0.14em]">{(business?.name || 'Agama').split(' ')[0]}</p>
          </div>
          {settings?.footerTagline ? <p className="max-w-md font-display text-2xl leading-snug text-paper-ink/90">{settings.footerTagline}</p> : null}
          {business?.strapline ? <p className="mt-4 text-sm text-paper-muted">{business.strapline}</p> : null}
        </div>

        <nav aria-label="Footer">
          <p className="mb-5 text-sm font-medium text-paper-muted">Explore</p>
          <ul className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
            {navigation.slice(0, 6).map((item) => (
              <li key={item.label}><Link to={item.href} className="text-paper-ink/80 transition hover:text-accent">{item.label}</Link></li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="mb-5 text-sm font-medium text-paper-muted">Visit</p>
          <address className="text-sm not-italic leading-6 text-paper-ink/80">{addressLines.length ? addressLines.map((l, i) => <span key={i} className="block">{l}</span>) : business?.address}</address>
          <div className="mt-5 grid gap-3 text-sm">
            {business?.phone ? <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-paper-ink/85 hover:text-accent"><Phone className="size-4" aria-hidden="true" /> {business.displayPhone || business.phone}</a> : null}
            {links.maps ? <a href={links.maps} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 text-paper-ink/85 hover:text-accent"><MapPin className="size-4" aria-hidden="true" /> Get directions <ArrowUpRight className="size-3.5" aria-hidden="true" /></a> : null}
            {socials.map(([label, url]) => (
              <a key={label} href={url} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 text-paper-ink/85 hover:text-accent"><Globe className="size-4" aria-hidden="true" /> {label}</a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-[1440px] flex-col gap-3 border-t border-paper-ink/10 px-5 pt-6 text-xs text-paper-muted sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
        <p>© {new Date().getFullYear()} {settings?.copyrightName || business?.name}.</p>
        {settings?.footerNote ? <p>{settings.footerNote}</p> : null}
      </div>
    </footer>
  );
}
