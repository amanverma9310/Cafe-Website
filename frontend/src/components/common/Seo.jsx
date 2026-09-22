import { Helmet } from 'react-helmet-async';
import { useSite } from '../../context/SiteContext.jsx';
import { SITE_URL } from '../../config/navigation.js';
import { mediaSrc } from '../../utils/media.js';

/** Per-page SEO: title, description, canonical, Open Graph and Twitter tags. */
export default function Seo({ title, description, path = '/', image, noindex = false }) {
  const { settings } = useSite();
  const template = settings?.titleTemplate || '%s | Agama Cafe & Bar';
  const fullTitle = title ? template.replace('%s', title) : settings?.siteTitle || 'Agama Cafe & Bar';
  const desc = description || settings?.metaDescription || '';
  const canonical = `${SITE_URL}${path === '/' ? '' : path}` || '/';
  const img = mediaSrc(image || settings?.seoImage?.secureUrl || '');
  const ogTitle = title || 'Agama Cafe & Bar';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {desc && <meta name="description" content={desc} />}
      {settings?.keywords?.length ? <meta name="keywords" content={settings.keywords.join(', ')} /> : null}
      <link rel="canonical" href={canonical || '/'} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Agama Cafe & Bar" />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:title" content={ogTitle} />
      {desc && <meta property="og:description" content={desc} />}
      <meta property="og:url" content={canonical || '/'} />
      {img && <meta property="og:image" content={img} />}
      <meta name="twitter:card" content={img ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={ogTitle} />
      {desc && <meta name="twitter:description" content={desc} />}
      {img && <meta name="twitter:image" content={img} />}
      {settings?.themeColor && <meta name="theme-color" content={settings.themeColor} />}
      {settings?.favicon?.secureUrl && <link rel="icon" href={mediaSrc(settings.favicon.secureUrl)} />}
    </Helmet>
  );
}
