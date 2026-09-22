/** Resolves a CMS link ({linkType, href}) into something a router <Link> or <a> can use. */
export function resolveLink(link, business) {
  if (!link) return null;
  switch (link.linkType) {
    case 'maps': return business?.links?.maps ? { href: business.links.maps, external: true } : null;
    case 'phone': return business?.phone ? { href: `tel:${business.phone}` } : null;
    case 'external': return link.href ? { href: link.href, external: true } : null;
    default: return link.href ? { to: link.href } : null;
  }
}
