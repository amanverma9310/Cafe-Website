import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { DataBoundary, Skeleton } from '../common/DataState.jsx';
import Img from '../common/Img.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { menuApi } from '../../services/index.js';
import { cn } from '../../utils/cn.js';
import { formatPrice } from '../../utils/format.js';
import { mediaSrc } from '../../utils/media.js';
import { buttonClass } from '../common/CtaLink.jsx';

const pdfButton = (doc) =>
  doc.pdf?.secureUrl ? (
    <a href={mediaSrc(doc.pdf.secureUrl)} target="_blank" rel="noreferrer noopener" className={buttonClass('secondary')}>
      <FileText className="size-4" aria-hidden="true" /> Open the original menu (PDF)
    </a>
  ) : null;

function BarPanel({ doc }) {
  return (
    <div className="card-surface grid items-center gap-10 p-8 sm:p-12 md:grid-cols-[auto_1fr]">
      {doc.cover?.secureUrl ? <div className="relative mx-auto aspect-[4/5] w-44 overflow-hidden rounded-2xl"><Img src={doc.cover.secureUrl} alt={doc.cover.alt} fill sizes="180px" /></div> : null}
      <div>
        <h2 className="display text-4xl">{doc.title}</h2>
        <p className="mt-4 max-w-xl leading-7 text-muted">{doc.details || doc.description}</p>
        <div className="mt-7">{pdfButton(doc)}</div>
      </div>
    </div>
  );
}

function ItemRow({ item, symbol }) {
  return (
    <li className="break-inside-avoid">
      <div className="flex items-baseline gap-3">
        <h3 className="font-display text-[1.4rem] leading-tight">{item.name}</h3>
        <span aria-hidden="true" className="-translate-y-1 flex-1 border-b border-dotted border-fg/25" />
        {item.price != null ? <span className="tabular-nums text-accent">{formatPrice(item.price, symbol)}</span> : null}
      </div>
      {item.description ? <p className="mt-1.5 max-w-lg text-sm leading-6 text-muted">{item.description}</p> : null}
      {item.dietaryTags?.length ? <p className="mt-2 flex flex-wrap gap-1.5">{item.dietaryTags.map((t) => <span key={t} className="rounded-full border border-leaf/30 bg-leaf/5 px-2.5 py-0.5 text-xs font-medium text-leaf">{t}</span>)}</p> : null}
    </li>
  );
}

function ItemsPanel({ doc }) {
  const { business } = useSite();
  const reduce = useReducedMotion();
  const [cat, setCat] = useState('all');
  const { data, loading, error, reload } = useAsync(() => menuApi.items({ menu: doc.key }), [doc.key]);
  const items = data?.items || [];
  const categories = useMemo(() => {
    const seen = new Map();
    items.forEach((i) => i.category && !seen.has(i.category.id) && seen.set(i.category.id, { ...i.category, n: 0 }));
    items.forEach((i) => i.category && seen.get(i.category.id).n++);
    return [...seen.values()];
  }, [items]);
  const visible = cat === 'all' ? items : items.filter((i) => i.category?.id === cat);

  return (
    <div>
      {doc.details ? <p className="mb-8 max-w-2xl leading-7 text-muted">{doc.details}</p> : null}
      <DataBoundary loading={loading} error={error} onRetry={reload} empty={!items.length} emptyText="Dishes for this menu are being added. Please open the PDF or ask the cafe."
        skeleton={<div className="grid gap-x-16 gap-y-8 md:grid-cols-2">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-16" />)}</div>}>
        {categories.length > 1 ? (
          <div className="scrollbar-none -mx-5 mb-10 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by category">
            {[{ id: 'all', name: 'All', n: items.length }, ...categories].map((c) => (
              <button key={c.id} type="button" onClick={() => setCat(c.id)} aria-pressed={cat === c.id}
                className={cn('min-h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition', cat === c.id ? 'border-accent bg-accent text-accent-ink' : 'border-line text-fg/80 hover:border-fg/40')}>
                {c.name} <span className="opacity-60">{c.n}</span>
              </button>
            ))}
          </div>
        ) : null}
        <AnimatePresence mode="wait">
          <motion.ul key={cat} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.25 }}
            className="gap-x-16 space-y-9 md:columns-2">
            {visible.map((it) => <ItemRow key={it.id} item={it} symbol={business?.currencySymbol} />)}
          </motion.ul>
        </AnimatePresence>
      </DataBoundary>
      <div className="mt-12">{pdfButton(doc)}</div>
    </div>
  );
}

/** Tabbed menu. `types` restricts which menu documents are shown (e.g. ['dietary'] on the dietary page). */
export default function MenuExplorer({ types }) {
  const [params, setParams] = useSearchParams();
  const { data, loading, error, reload } = useAsync(() => menuApi.documents(), []);
  const docs = (data || []).filter((d) => !types || types.includes(d.type));
  const active = docs.find((d) => d.key === params.get('tab'))?.key ?? docs[0]?.key;

  return (
    <DataBoundary loading={loading} error={error} onRetry={reload} empty={!docs.length} emptyText="The menu is being updated. Please check back soon or call the cafe."
      skeleton={<div className="space-y-8"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-64" /></div>}>
      <Tabs value={active} onValueChange={(v) => setParams({ tab: v }, { replace: true, preventScrollReset: true })} className="gap-10">
        <TabsList className="scrollbar-none -mx-5 w-[calc(100%+2.5rem)] gap-7 overflow-x-auto border-b border-line px-5 sm:mx-0 sm:w-full sm:px-0" aria-label="Menus">
          {docs.map((d) => <TabsTrigger key={d.key} value={d.key} className="font-display text-xl sm:text-2xl">{d.tabLabel || d.title}</TabsTrigger>)}
        </TabsList>
        {docs.map((d) => (
          <TabsContent key={d.key} value={d.key}>{d.type === 'bar' ? <BarPanel doc={d} /> : <ItemsPanel doc={d} />}</TabsContent>
        ))}
      </Tabs>
    </DataBoundary>
  );
}
