import Seo from '../components/common/Seo.jsx';
import PageHero from '../components/common/PageHero.jsx';
import SiteContainer from '../components/common/SiteContainer.jsx';
import GalleryGrid from '../components/gallery/GalleryGrid.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { contentApi } from '../services/index.js';

export default function Gallery() {
  const hero = useAsync(() => contentApi.hero('gallery'), []);
  return (
    <main id="main-content">
      <Seo title="Gallery" path="/gallery" description={hero.data?.copy} image={hero.data?.image?.secureUrl} />
      <PageHero hero={hero.data} loading={hero.loading} />
      <SiteContainer className="py-16 sm:py-24"><GalleryGrid /></SiteContainer>
    </main>
  );
}
