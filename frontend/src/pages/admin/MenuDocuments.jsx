import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync.js';
import { menuApi } from '../../services/index.js';
import { fileSize, mediaSrc } from '../../utils/media.js';
import { notifyError } from '../../utils/errors.js';
import FileField from '../../components/admin/ui/FileField.jsx';
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorPanel, Field, IconButton, Loading, Modal, ModalFooter, PageHeader, ProgressBar, Switch, SwitchField, applyServerErrors, inputCls } from '../../components/admin/ui/kit.jsx';

const TYPES = { main: 'Main menu', dietary: 'Dietary menu', bar: 'Bar menu (information only)' };

function DocForm({ doc, onSaved, onCancel }) {
  const [pdf, setPdf] = useState(null);
  const [cover, setCover] = useState(null);
  const [rmPdf, setRmPdf] = useState(false);
  const [rmCover, setRmCover] = useState(false);
  const [progress, setProgress] = useState(null);
  const { register, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { title: doc?.title ?? '', tabLabel: doc?.tabLabel ?? '', description: doc?.description ?? '', details: doc?.details ?? '', type: doc?.type ?? 'dietary', enabled: doc?.enabled ?? true },
  });
  const submit = async (v) => {
    setProgress(pdf || cover ? 0 : null);
    try {
      await menuApi.saveDocument(doc?.id, { ...v, removePdf: rmPdf && !pdf, removeCover: rmCover && !cover }, { pdf, cover }, setProgress);
      toast.success(doc ? 'Menu updated.' : 'Menu added.');
      onSaved();
    } catch (err) { applyServerErrors(err, setError); notifyError(err); setProgress(null); }
  };
  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Title" htmlFor="d-title" required error={errors.title?.message}><input id="d-title" aria-invalid={!!errors.title} className={inputCls} {...register('title', { required: 'Title is required' })} /></Field>
        <Field label="Tab label" htmlFor="d-tab" hint="Short name shown on the menu tab."><input id="d-tab" className={inputCls} {...register('tabLabel')} /></Field>
      </div>
      <Field label="Type" htmlFor="d-type" hint="Bar menus are shown as a PDF only — guests cannot order alcohol on this website.">
        <select id="d-type" className={inputCls} {...register('type')}>{Object.entries(TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      </Field>
      <Field label="Short description" htmlFor="d-desc" error={errors.description?.message}><input id="d-desc" className={inputCls} {...register('description', { maxLength: { value: 240, message: 'Keep this under 240 characters' } })} /></Field>
      <Field label="Details shown above the dishes" htmlFor="d-det" error={errors.details?.message}><textarea id="d-det" rows={3} className={inputCls + ' py-2.5'} {...register('details', { maxLength: { value: 500, message: 'Keep this under 500 characters' } })} /></Field>
      <FileField kind="pdf" label="Menu PDF" current={doc?.pdf} file={pdf} removed={rmPdf} onFile={setPdf} onRemoved={setRmPdf} />
      <FileField kind="image" label="Cover image" current={doc?.cover} file={cover} removed={rmCover} onFile={setCover} onRemoved={setRmCover} />
      <SwitchField label="Visible on the website" checked={watch('enabled')} onChange={(v) => setValue('enabled', v)} />
      <ProgressBar value={progress} />
      <ModalFooter><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" loading={isSubmitting}>{doc ? 'Save changes' : 'Add menu'}</Button></ModalFooter>
    </form>
  );
}

export default function MenuDocuments() {
  const { data, loading, error, reload, setData } = useAsync(() => menuApi.adminDocuments(), []);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const docs = data || [];

  const move = async (i, dir) => {
    const next = [...docs]; const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    const prev = docs; setData(next);
    try { await menuApi.reorderDocuments(next.map((d) => d.id)); } catch (err) { setData(prev); notifyError(err); }
  };
  const toggle = async (d, enabled) => {
    setData((x) => x.map((i) => (i.id === d.id ? { ...i, enabled } : i)));
    try { await menuApi.saveDocument(d.id, { title: d.title, tabLabel: d.tabLabel, description: d.description, details: d.details, type: d.type, enabled }, {}); }
    catch (err) { notifyError(err); reload({ silent: true }); }
  };

  return (
    <>
      <PageHeader title="Dietary menus & PDFs" description="The menu tabs on your website, each with an optional PDF and cover image. Upload files from your device." actions={<Button onClick={() => setEditing('new')}><Plus className="size-4" aria-hidden="true" /> Add menu</Button>} />
      {loading && !data ? <Loading /> : error ? <ErrorPanel error={error} onRetry={reload} /> : docs.length === 0 ? <EmptyState title="No menus yet">Add your main menu first.</EmptyState> : (
        <div className="grid gap-4 md:grid-cols-2">
          {docs.map((d, i) => (
            <Card key={d.id} className="flex gap-4 p-5">
              <div className="flex flex-col"><IconButton label={`Move ${d.title} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-4" aria-hidden="true" /></IconButton><IconButton label={`Move ${d.title} down`} disabled={i === docs.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" aria-hidden="true" /></IconButton></div>
              <div className="grid h-24 w-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-stone-100">{d.cover?.secureUrl ? <img src={mediaSrc(d.cover.secureUrl)} alt="" className="size-full object-cover" /> : <FileText className="size-6 text-stone-400" aria-hidden="true" />}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2"><p className="font-semibold">{d.title}</p><Switch checked={d.enabled} onChange={(v) => toggle(d, v)} label={`${d.title} visible`} /></div>
                <p className="mt-1 flex flex-wrap gap-1.5"><Badge tone={d.type === 'bar' ? 'amber' : 'blue'}>{TYPES[d.type].split(' (')[0]}</Badge>{d.type !== 'bar' ? <Badge>{d.itemCount} dishes</Badge> : null}{d.pdf?.secureUrl ? <Badge tone="green">PDF {d.pdf.bytes ? `· ${fileSize(d.pdf.bytes)}` : 'attached'}</Badge> : <Badge tone="red">No PDF</Badge>}</p>
                <div className="mt-3 flex gap-1"><Button variant="secondary" size="sm" onClick={() => setEditing(d)}><Pencil className="size-3.5" aria-hidden="true" /> Edit</Button><Button variant="ghost" size="sm" onClick={() => setDeleting(d)}><Trash2 className="size-3.5 text-red-600" aria-hidden="true" /> Delete</Button></div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing === 'new' ? 'Add a menu' : 'Edit menu'} size="lg">
        {editing ? <DocForm key={editing.id || 'new'} doc={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload({ silent: true }); }} /> : null}
      </Modal>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title={`Delete “${deleting?.title}”?`}
        description={deleting?.itemCount ? `This menu still has ${deleting.itemCount} dishes. Move or delete those dishes first — the server will refuse otherwise.` : 'The menu and its PDF and cover image will be removed.'}
        onConfirm={async () => { await menuApi.deleteDocument(deleting.id); toast.success('Menu deleted.'); reload({ silent: true }); }} />
    </>
  );
}
