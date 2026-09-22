import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import { cn } from '../../utils/cn.js';
import { resolveLink } from '../../utils/links.js';

const base = 'inline-flex min-h-12 items-center justify-center gap-2 font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2';
export const buttonClass = (variant = 'primary', tone = 'dark') =>
  cn(
    base,
    // Primary: warm gold pill everywhere — the one colour reserved for the main call to action.
    variant === 'primary' && 'rounded-full bg-accent px-6 text-accent-ink shadow-[0_14px_30px_-16px_rgb(214_163_93/0.7)] hover:-translate-y-0.5 hover:brightness-[1.07]',
    // Secondary: a quiet outline — cream-on-forest for the dark sections, a soft leaf tint for the cream sections.
    variant === 'secondary' && (tone === 'paper' ? 'rounded-full border border-paper-ink/35 px-6 text-paper-ink hover:bg-paper-ink hover:text-paper' : 'rounded-full border border-fg/25 bg-transparent px-6 text-fg hover:border-leaf/50 hover:bg-leaf/8'),
    variant === 'link' && (tone === 'paper' ? 'px-2 text-paper-ink underline decoration-accent/80 underline-offset-8 hover:text-accent' : 'px-2 text-fg/85 underline decoration-accent/70 underline-offset-8 hover:text-fg'),
  );

/** Renders a CMS-managed call to action ({label, linkType, href, variant}). Renders nothing when the link cannot be resolved. */
export default function CtaLink({ cta, className, tone = 'dark', arrow = false, children }) {
  const { business } = useSite();
  const target = resolveLink(cta, business);
  if (!target || !cta?.label) return null;
  const cls = cn(buttonClass(cta.variant, tone), className);
  const content = (
    <>
      {children ?? cta.label}
      {arrow || cta.variant === 'primary' ? <ArrowUpRight className="size-4" aria-hidden="true" /> : null}
    </>
  );
  return target.to ? (
    <Link to={target.to} className={cls}>{content}</Link>
  ) : (
    <a href={target.href} target={target.external ? '_blank' : undefined} rel={target.external ? 'noreferrer noopener' : undefined} className={cls}>{content}</a>
  );
}
