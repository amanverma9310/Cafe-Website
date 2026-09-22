import Seo from '../components/common/Seo.jsx';
import { ErrorState } from '../components/common/DataState.jsx';
import Hero from '../components/home/Hero.jsx';
import { SECTION_COMPONENTS } from '../components/home/registry.js';
import SiteContainer from '../components/common/SiteContainer.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { contentApi } from '../services/index.js';

export default function Home() {
  const { data, loading, error, reload } = useAsync(() => contentApi.home(), []);
  return (
    <main id="main-content">
      <Seo path="/" image={data?.hero?.image?.secureUrl} />
      <Hero hero={data?.hero} loading={loading} />
      {error ? <SiteContainer className="py-24"><ErrorState error={error} onRetry={reload} /></SiteContainer> : null}
      {(data?.sections || []).map((s) => {
        const Section = SECTION_COMPONENTS[s.key];
        return Section ? <Section key={s.key} section={s} /> : null;
      })}
    </main>
  );
}
