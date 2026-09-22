import { useMemo, useState } from 'react';
import { DataBoundary, Skeleton } from '../common/DataState.jsx';
import Img from '../common/Img.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { galleryApi } from '../../services/index.js';
import { cn } from '../../utils/cn.js';

const ORDER = ['Food', 'Ambience', 'Drinks', 'Exterior'];

export default function GalleryGrid() {
  const { data, loading, error, reload } = useAsync(() => galleryApi.list(), []);
  const [type, setType] = useState('All');
  const images = data?.items || [];
  const types = useMemo(() => {
    const found = [...new Set(images.map((i) => i.type))];
    return ['All', ...found.sort((a, b) => (ORDER.indexOf(a) + 99) % 99 - (ORDER.indexOf(b) + 99) % 99)];
  }, [images]);
  const visible = type === 'All' ? images : images.filter((i) => i.type === type);

  return (
    <DataBoundary loading={loading} error={error} onRetry={reload} empty={!images.length} emptyText="Photos are on their way. Please check back soon."
      skeleton={<div className="columns-2 gap-4 md:columns-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className={cn('mb-4 w-full', i % 2 ? 'h-56' : 'h-72')} />)}</div>}>
      <div className="mb-10 flex flex-wrap gap-2" role="group" aria-label="Filter photos">
        {types.map((t) => (
          <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)}
            className={cn('min-h-10 rounded-full border px-5 text-sm font-medium transition', type === t ? 'border-accent bg-accent text-accent-ink' : 'border-line text-fg/80 hover:border-fg/40')}>{t}</button>
        ))}
      </div>
      <ul className="columns-2 gap-4 md:columns-3 lg:columns-4">
        {visible.map((im, i) => (
          <li key={im.id} className="group mb-4 break-inside-avoid">
            <figure className={cn('relative overflow-hidden rounded-2xl bg-raised shadow-[var(--shadow-soft)]', im.featured || i % 5 === 0 ? 'aspect-[4/5]' : i % 3 === 0 ? 'aspect-square' : 'aspect-[4/3]')}>
              <Img src={im.image.secureUrl} alt={im.alt} fill sizes="(min-width:1024px) 25vw, 50vw" className="transition-transform duration-700 group-hover:scale-105" />
              <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs text-paper-ink opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">{im.type}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </DataBoundary>
  );
}
