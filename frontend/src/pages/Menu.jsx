import Seo from '../components/common/Seo.jsx';
import PageHero from '../components/common/PageHero.jsx';
import SiteContainer from '../components/common/SiteContainer.jsx';
import MenuExplorer from '../components/menu/MenuExplorer.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { contentApi } from '../services/index.js';

/** Shared by /menu (all menus) and /dietary-menu (dietary menus only). */
export default function MenuPage({ pageKey = 'menu', title = 'Menu', path = '/menu', types }) {
  const hero = useAsync(() => contentApi.hero(pageKey), [pageKey]);
  return (
    <main id="main-content">
      <Seo title={title} path={path} description={hero.data?.copy} image={hero.data?.image?.secureUrl} />
      <PageHero hero={hero.data} loading={hero.loading} />
      <SiteContainer className="py-16 sm:py-24"><MenuExplorer types={types} /></SiteContainer>
    </main>
  );
}
