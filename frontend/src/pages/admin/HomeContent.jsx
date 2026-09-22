import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, ExternalLink, Pencil } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync.js';
import { contentApi } from '../../services/index.js';
import { notifyError } from '../../utils/errors.js';
import { cn } from '../../utils/cn.js';
import HeroForm from '../../components/admin/HeroForm.jsx';
import SectionEditor, { SECTIONS, sectionPayload } from '../../components/admin/SectionEditor.jsx';
import { Badge, Button, Card, ErrorPanel, IconButton, Loading, Modal, PageHeader, Switch } from '../../components/admin/ui/kit.jsx';

function Sections() {
  const { data, loading, error, reload, setData } = useAsync(() => contentApi.sections(), []);
  const [editing, setEditing] = useState(null);
  const sections = data || [];

  const move = async (i, d) => {
    const next = [...sections]; [next[i], next[i + d]] = [next[i + d], next[i]];
    const prev = sections; setData(next);
    try { await contentApi.reorderSections(next.map((s) => s.key)); } catch (e) { setData(prev); notifyError(e); }
  };
  const toggle = async (s, enabled) => {
    setData((d) => d.map((x) => (x.key === s.key ? { ...x, enabled } : x)));
    try { await contentApi.saveSection(s.key, { ...sectionPayload(s), enabled }); } catch (e) { notifyError(e); reload({ silent: true }); }
  };
  const update = (s) => setData((d) => d.map((x) => (x.key === s.key ? s : x)));

  if (loading && !data) return <Loading />;
  if (error) return <ErrorPanel error={error} onRetry={reload} />;
  return (
    <>
      <Card className="divide-y divide-stone-100">
        {sections.map((s, i) => {
          const cfg = SECTIONS[s.key];
          const needsVideo = cfg.video && s.enabled && !s.video?.secureUrl;
          return (
            <div key={s.key} className={cn('flex flex-wrap items-center gap-3 p-4', !s.enabled && 'bg-stone-50')}>
              <div className="flex flex-col"><IconButton label={`Move ${cfg.label} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-4" aria-hidden="true" /></IconButton><IconButton label={`Move ${cfg.label} down`} disabled={i === sections.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" aria-hidden="true" /></IconButton></div>
              <div className="min-w-0 flex-1 basis-64">
                <p className="flex flex-wrap items-center gap-2 font-semibold">{cfg.label}{needsVideo ? <Badge tone="amber">Needs a video to appear</Badge> : null}{cfg.video && s.video?.secureUrl ? <Badge tone="green">Video uploaded</Badge> : null}{cfg.images ? <Badge>{s.images?.length || 0} photo{s.images?.length === 1 ? '' : 's'}</Badge> : null}</p>
                <p className="text-sm text-stone-500">{s.title || cfg.hint}</p>
              </div>
              <div className="flex items-center gap-3"><Switch checked={s.enabled} onChange={(v) => toggle(s, v)} label={`Show ${cfg.label}`} /><Button variant="secondary" size="sm" onClick={() => setEditing(s)}><Pencil className="size-3.5" aria-hidden="true" /> Edit</Button></div>
            </div>
          );
        })}
      </Card>
      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing ? SECTIONS[editing.key].label : ''} size="xl">
        {editing ? <SectionEditor key={editing.key} section={editing} onSaved={update} onClose={() => setEditing(null)} /> : null}
      </Modal>
    </>
  );
}

export default function HomeContent() {
  const [tab, setTab] = useState('sections');
  return (
    <>
      <PageHeader title="Home page" description="Change what appears on the home page, in what order, and upload photos and video from your device." actions={<a href="/" target="_blank" rel="noreferrer noopener" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold hover:bg-stone-100">Preview <ExternalLink className="size-4" aria-hidden="true" /></a>} />
      <div role="tablist" aria-label="Home page content" className="mb-6 inline-flex rounded-lg bg-stone-200/70 p-1">
        {[['sections', 'Sections'], ['hero', 'Top banner & video']].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} type="button" onClick={() => setTab(k)} className={cn('min-h-9 rounded-md px-4 text-sm font-semibold transition', tab === k ? 'bg-white shadow-sm' : 'text-stone-600 hover:text-stone-900')}>{l}</button>
        ))}
      </div>
      {tab === 'sections' ? <Sections /> : <HeroForm pageKey="home" />}
    </>
  );
}
