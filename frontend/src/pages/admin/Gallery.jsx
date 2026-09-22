import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { galleryApi } from '../../services/index.js';
import { notifyError } from '../../utils/errors.js';
import { mediaSrc } from '../../utils/media.js';
import FileField from '../../components/admin/ui/FileField.jsx';
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorPanel, Field, IconButton, Loading, Modal, ModalFooter, PageHeader, Pagination, ProgressBar, SearchInput, SwitchField, applyServerErrors, inputCls } from '../../components/admin/ui/kit.jsx';

const BASE_TYPES = ['Food', 'Ambience', 'Drinks', 'Exterior'];

function PhotoForm({ photo, types, onSaved, onCancel }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [fileErr, setFileErr] = useState('');
  const { register, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { alt: photo?.alt ?? '', type: photo?.type ?? 'Food', featured: photo?.featured ?? false, enabled: photo?.enabled ?? true },
  });
  const submit = async (v) => {
    if (!photo && !file) return setFileErr('Choose an image to upload.');
    setFileErr(''); setProgress(file ? 0 : null);
    try { await galleryApi.save(photo?.id, v, file, setProgress); toast.success(photo ? 'Photo updated.' : 'Photo added.'); onSaved(); }
    catch (err) { applyServerErrors(err, setError); notifyError(err); setProgress(null); }
  };
  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
      <FileField kind="image" label="Photo" required={!photo} current={photo?.image} file={file} onFile={(f) => { setFile(f); setFileErr(''); }} error={fileErr} />
      <Field label="Describe the photo" htmlFor="g-alt" required error={errors.alt?.message} hint="Read aloud by screen readers and used by search engines.">
        <input id="g-alt" aria-invalid={!!errors.alt} className={inputCls} {...register('alt', { required: 'Add a short description', maxLength: { value: 200, message: 'Keep this under 200 characters' } })} />
      </Field>
      <Field label="Type" htmlFor="g-type" required error={errors.type?.message} hint="Pick one or type a new one — it becomes a filter on the website.">
        <input id="g-type" list="g-types" className={inputCls} {...register('type', { required: 'Choose a type' })} />
        <datalist id="g-types">{types.map((t) => <option key={t} value={t} />)}</datalist>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <SwitchField label="Featured" hint="Shown larger in the gallery." checked={watch('featured')} onChange={(v) => setValue('featured', v)} />
        <SwitchField label="Visible" hint="Turn off to hide it." checked={watch('enabled')} onChange={(v) => setValue('enabled', v)} />
      </div>
      <ProgressBar value={progress} />
      <ModalFooter><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" loading={isSubmitting}>{photo ? 'Save changes' : 'Add photo'}</Button></ModalFooter>
    </form>
  );
}

export default function Gallery() {
  const [q, setQ] = useState('');
  const dq = useDebounce(q);
  const [type, setType] = useState('');
  const [enabled, setEnabled] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const all = useAsync(() => galleryApi.adminList({ limit: 200 }), []);
  const list = useAsync(() => galleryApi.adminList({ page, limit: 12, q: dq || undefined, type: type || undefined, enabled: enabled || undefined }), [page, dq, type, enabled]);
  useEffect(() => setPage(1), [dq, type, enabled]);

  const types = [...new Set([...BASE_TYPES, ...(all.data?.items || []).map((i) => i.type)])];
  const items = list.data?.items || [];
  const refresh = () => { list.reload({ silent: true }); all.reload({ silent: true }); };
  const patch = async (p, body) => {
    try { await galleryApi.patch(p.id, body); list.setData((d) => ({ ...d, items: d.items.map((i) => (i.id === p.id ? { ...i, ...body } : i)) })); } catch (err) { notifyError(err); }
  };
  // Neighbours swap sort positions, so this works page by page.
  const move = async (i, dir) => {
    const a = items[i]; const b = items[i + dir];
    if (!b) return;
    const [oa, ob] = a.displayOrder === b.displayOrder ? [i, i + dir] : [a.displayOrder, b.displayOrder];
    try { await Promise.all([galleryApi.patch(a.id, { displayOrder: ob }), galleryApi.patch(b.id, { displayOrder: oa })]); refresh(); } catch (err) { notifyError(err); }
  };

  return (
    <>
      <PageHeader title="Gallery" description="Photos shown on the Gallery page. Upload from your device — images are optimised automatically." actions={<Button onClick={() => setEditing('new')}><Plus className="size-4" aria-hidden="true" /> Add photo</Button>} />
      <Card className="mb-5 grid gap-3 p-4 md:grid-cols-[1.6fr_1fr_1fr]">
        <SearchInput value={q} onChange={setQ} placeholder="Search by description…" />
        <select aria-label="Filter by type" value={type} onChange={(e) => setType(e.target.value)} className={inputCls}><option value="">All types</option>{types.map((t) => <option key={t}>{t}</option>)}</select>
        <select aria-label="Filter by visibility" value={enabled} onChange={(e) => setEnabled(e.target.value)} className={inputCls}><option value="">Visible &amp; hidden</option><option value="true">Visible</option><option value="false">Hidden</option></select>
      </Card>
      {list.loading && !list.data ? <Loading /> : list.error ? <ErrorPanel error={list.error} onRetry={list.reload} /> : items.length === 0 ? <EmptyState title="No photos found" action={<Button onClick={() => setEditing('new')}>Add a photo</Button>}>Try a different filter, or upload your first photo.</EmptyState> : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p, i) => (
            <li key={p.id}>
              <Card className={`overflow-hidden ${p.enabled ? '' : 'opacity-60'}`}>
                <div className="relative aspect-[4/3] bg-stone-100"><img src={mediaSrc(p.image.secureUrl)} alt={p.alt} className="size-full object-cover" loading="lazy" />{!p.enabled ? <Badge tone="amber" className="absolute left-2 top-2">Hidden</Badge> : null}</div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium" title={p.alt}>{p.alt}</p>
                  <p className="mt-1"><Badge tone="blue">{p.type}</Badge></p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex"><IconButton label="Move earlier" disabled={i === 0} onClick={() => move(i, -1)}><ArrowLeft className="size-4" aria-hidden="true" /></IconButton><IconButton label="Move later" disabled={i === items.length - 1} onClick={() => move(i, 1)}><ArrowRight className="size-4" aria-hidden="true" /></IconButton></div>
                    <div className="flex">
                      <IconButton label={p.featured ? 'Unfeature photo' : 'Feature photo'} aria-pressed={p.featured} onClick={() => patch(p, { featured: !p.featured })}><Star className={`size-4 ${p.featured ? 'fill-amber-400 text-amber-500' : ''}`} aria-hidden="true" /></IconButton>
                      <IconButton label={p.enabled ? 'Hide photo' : 'Show photo'} onClick={() => patch(p, { enabled: !p.enabled })}>{p.enabled ? <Eye className="size-4" aria-hidden="true" /> : <EyeOff className="size-4" aria-hidden="true" />}</IconButton>
                      <IconButton label="Edit photo" onClick={() => setEditing(p)}><Pencil className="size-4" aria-hidden="true" /></IconButton>
                      <IconButton label="Delete photo" onClick={() => setDeleting(p)}><Trash2 className="size-4 text-red-600" aria-hidden="true" /></IconButton>
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <Pagination meta={list.data?.meta} onPage={setPage} />
      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing === 'new' ? 'Add a photo' : 'Edit photo'}>
        {editing ? <PhotoForm key={editing.id || 'new'} photo={editing === 'new' ? null : editing} types={types} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} /> : null}
      </Modal>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete this photo?" description="It will be removed from the gallery and from media storage. This can’t be undone." onConfirm={async () => { await galleryApi.remove(deleting.id); toast.success('Photo deleted.'); refresh(); }} />
    </>
  );
}
