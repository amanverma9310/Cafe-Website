import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ErrorBoundary from '../components/common/ErrorBoundary.jsx';
import { ErrorState, Skeleton } from '../components/common/DataState.jsx';
import Footer from '../components/layout/Footer.jsx';
import MobileActionBar from '../components/layout/MobileActionBar.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import ScrollManager from '../routes/ScrollManager.jsx';
import { SITE_URL } from '../config/navigation.js';
import { useSite } from '../context/SiteContext.jsx';
import { mediaSrc } from '../utils/media.js';

function restaurantSchema(business, settings) {
  if (!business?.name) return null;
  const a = business.addressParts || {};
  return {
    '@context': 'https://schema.org',
    '@type': ['Restaurant', 'CafeOrCoffeeShop'],
    name: business.name,
    description: settings?.metaDescription,
    url: SITE_URL,
    telephone: business.phone || undefined,
    priceRange: business.priceRange || undefined,
    servesCuisine: ['Vegan', 'Plant-based', 'Cafe'],
    image: settings?.seoImage?.secureUrl ? mediaSrc(settings.seoImage.secureUrl) : undefined,
    address: { '@type': 'PostalAddress', streetAddress: a.streetAddress, addressLocality: a.locality, addressRegion: a.region, postalCode: a.postalCode, addressCountry: a.country },
    aggregateRating: business.rating ? { '@type': 'AggregateRating', ratingValue: business.rating, reviewCount: business.reviewCount, bestRating: 5 } : undefined,
  };
}

export default function MainLayout() {
  const { business, settings, loading, error, reload } = useSite();
  useEffect(() => { document.documentElement.classList.add('public'); return () => document.documentElement.classList.remove('public'); }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-base" aria-busy="true" aria-label="Loading">
        <div className="h-[76px] border-b border-line" />
        <div className="mx-auto max-w-[1440px] space-y-6 px-8 pt-32"><Skeleton className="h-20 w-2/3" /><Skeleton className="h-6 w-1/2" /><Skeleton className="h-12 w-48 rounded-full" /></div>
      </div>
    );
  }
  if (error) {
    return <div className="grid min-h-screen place-items-center bg-base px-5 text-fg"><ErrorState error={error} onRetry={reload} className="max-w-lg" /></div>;
  }
  const schema = restaurantSchema(business, settings);
  return (
    <div className="min-h-screen bg-base text-fg">
      <Helmet>{schema ? <script type="application/ld+json">{JSON.stringify(schema)}</script> : null}</Helmet>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <ScrollManager />
      <Navbar />
      <ErrorBoundary><Outlet /></ErrorBoundary>
      <Footer />
      <MobileActionBar />
    </div>
  );
}
