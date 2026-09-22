import { Link, NavLink, useLocation } from 'react-router-dom';
import { CalendarCheck, Menu, Phone, Sprout } from 'lucide-react';
import { navigation } from '../../config/navigation.js';
import { useSite } from '../../context/SiteContext.jsx';
import { cn } from '../../utils/cn.js';
import { mediaSrc } from '../../utils/media.js';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '../ui/sheet.jsx';
import { resolveLink } from '../../utils/links.js';

function Brand({ business, logo, className }) {
  const [main, ...rest] = (business?.name || 'Agama Cafe & Bar').split(' ');
  return (
    <span className={cn('flex items-center gap-3', className)}>
      {logo ? (
        <img src={mediaSrc(logo)} alt="" className="size-10 rounded-full object-cover" />
      ) : (
        <span className="grid size-10 place-items-center text-leaf transition-transform duration-300 group-hover:-rotate-6"><Sprout className="size-7" aria-hidden="true" /></span>
      )}
      <span>
        <span className="block font-display text-[1.45rem] uppercase leading-none tracking-[0.14em] text-fg">{main}</span>
        <span className="mt-1 block text-[0.68rem] font-medium tracking-[0.12em] text-muted">{rest.join(' ') || 'Cafe & Bar'}</span>
      </span>
    </span>
  );
}

export default function Navbar() {
  const { business, settings } = useSite();
  const { pathname, hash } = useLocation();
  const reserve = resolveLink({ linkType: 'internal', href: business?.links?.reservation || '/contact#enquiry' }, business);
  const active = (href) => {
    const [path, h] = href.split('#');
    if (h) return pathname === path && hash === `#${h}`;
    return path === '/' ? pathname === '/' && !hash : pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-base/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link to="/" className="group" aria-label={`${business?.name || 'Agama Cafe & Bar'} home`}>
          <Brand business={business} logo={settings?.logo?.secureUrl} />
        </Link>

        <nav className="hidden items-center gap-7 xl:flex" aria-label="Primary navigation">
          {navigation.map((item) => (
            <NavLink key={item.label} to={item.href} className={cn('border-b border-transparent py-2 text-sm font-medium text-muted transition-colors hover:text-fg', active(item.href) && 'border-accent text-fg')}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href={business?.phone ? `tel:${business.phone}` : undefined} className="hidden min-h-11 items-center gap-2 px-3 text-sm font-semibold text-fg lg:flex">
            <Phone className="size-4 text-leaf" aria-hidden="true" /> Call Now
          </a>
          {reserve?.to ? (
            <Link to={reserve.to} className="hidden min-h-11 items-center gap-2 rounded-full bg-paper px-5 text-sm font-semibold text-paper-ink transition hover:-translate-y-0.5 hover:brightness-110 sm:inline-flex"><CalendarCheck className="size-4" aria-hidden="true" /> Reserve a Table</Link>
          ) : null}
          <Sheet>
            <SheetTrigger className="grid size-11 place-items-center rounded-full border border-fg/30 text-fg xl:hidden" aria-label="Open navigation menu">
              <Menu className="size-5" aria-hidden="true" />
            </SheetTrigger>
            <SheetContent className="border-l border-line bg-surface p-0 text-fg">
              <div className="border-b border-line p-7">
                <SheetTitle className="font-display text-3xl uppercase tracking-[0.14em]">{(business?.name || 'Agama').split(' ')[0]}</SheetTitle>
                <SheetDescription className="mt-1 text-sm text-muted">{business?.strapline}</SheetDescription>
              </div>
              <nav className="grid gap-1 overflow-y-auto p-5" aria-label="Mobile navigation">
                {navigation.map((item) => (
                  <SheetClose asChild key={item.label}>
                    <Link to={item.href} className="flex min-h-12 items-center border-b border-line px-2 py-3 font-display text-2xl text-fg transition hover:pl-4 hover:text-accent">{item.label}</Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto grid gap-3 p-7">
                {reserve?.to ? <SheetClose asChild><Link to={reserve.to} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-paper px-5 font-semibold text-paper-ink"><CalendarCheck className="size-4" aria-hidden="true" /> Reserve a Table</Link></SheetClose> : null}
                {business?.phone ? <a href={`tel:${business.phone}`} className="inline-flex min-h-12 items-center justify-center rounded-full border border-fg/30 px-5 font-semibold">Call {business.displayPhone || business.phone}</a> : null}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
