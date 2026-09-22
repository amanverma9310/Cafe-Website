import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync.js';
import { reviewApi } from '../../services/index.js';
import { notifyError } from '../../utils/errors.js';
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorPanel, Field, IconButton, Loading, Modal, ModalFooter, PageHeader, Switch, SwitchField, applyServerErrors, inputCls } from '../../components/admin/ui/kit.jsx';

const Stars = ({ n }) => <span className="flex" role="img" aria-label={`${n} out of 5`}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`size-4 ${i <= n ? 'fill-amber-400 text-amber-500' : 'text-stone-300'}`} aria-hidden="true" />)}</span>;

function ReviewForm({ review, onSaved, onCancel }) {
  const { register, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { reviewerName: review?.reviewerName ?? '', rating: review?.rating ?? 5, text: review?.text ?? '', source: review?.source ?? 'Google', enabled: review?.enabled ?? true, featured: review?.featured ?? false },
  });
  const rating = watch('rating');
  const submit = async (v) => {
    try { await reviewApi.save(review?.id, { ...v, rating: Number(v.rating) }); toast.success(review ? 'Review updated.' : 'Review added.'); onSaved(); }
    catch (err) { applyServerErrors(err, setError); notifyError(err); }
  };
  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Only add reviews you have permission to show, and keep the reviewer’s wording accurate.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Reviewer name" htmlFor="r-name" required error={errors.reviewerName?.message}><input id="r-name" className={inputCls} {...register('reviewerName', { required: 'Name is required' })} /></Field>
        <Field label="Source" htmlFor="r-src" hint="e.g. Google"><input id="r-src" className={inputCls} {...register('source')} /></Field>
      </div>
      <Field label="Rating" error={errors.rating?.message}>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setValue('rating', n)} className="grid size-10 place-items-center rounded-lg hover:bg-stone-100">
              <Star className={`size-6 ${n <= rating ? 'fill-amber-400 text-amber-500' : 'text-stone-300'}`} aria-hidden="true" />
            </button>
          ))}
        </div>
      </Field>
      <Field label="Review" htmlFor="r-text" required error={errors.text?.message}><textarea id="r-text" rows={4} aria-invalid={!!errors.text} className={inputCls + ' py-2.5'} {...register('text', { required: 'Review text is required', maxLength: { value: 800, message: 'Keep this under 800 characters' } })} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <SwitchField label="Visible" checked={watch('enabled')} onChange={(v) => setValue('enabled', v)} />
        <SwitchField label="Featured" hint="Highlighted first." checked={watch('featured')} onChange={(v) => setValue('featured', v)} />
      </div>
      <ModalFooter><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" loading={isSubmitting}>{review ? 'Save changes' : 'Add review'}</Button></ModalFooter>
    </form>
  );
}

export default function Reviews() {
  const { data, loading, error, reload, setData } = useAsync(() => reviewApi.adminList(), []);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const reviews = data || [];
  const patch = async (r, body) => {
    setData((d) => d.map((x) => (x.id === r.id ? { ...x, ...body } : x)));
    try { await reviewApi.patch(r.id, body); } catch (err) { notifyError(err); reload({ silent: true }); }
  };
  const move = async (i, dir) => {
    const next = [...reviews]; const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    const prev = reviews; setData(next);
    try { await reviewApi.reorder(next.map((r) => r.id)); } catch (err) { setData(prev); notifyError(err); }
  };
  return (
    <>
      <PageHeader title="Reviews" description="Guest reviews shown in the “Guest impressions” block. When there are none, the home page shows the summary from Home page → Reviews." actions={<Button onClick={() => setEditing('new')}><Plus className="size-4" aria-hidden="true" /> Add review</Button>} />
      {loading && !data ? <Loading /> : error ? <ErrorPanel error={error} onRetry={reload} /> : reviews.length === 0 ? <EmptyState title="No reviews yet" action={<Button onClick={() => setEditing('new')}>Add a review</Button>}>Optional. Add real guest reviews you have permission to display.</EmptyState> : (
        <Card className="divide-y divide-stone-100">
          {reviews.map((r, i) => (
            <div key={r.id} className={`flex flex-wrap items-start gap-3 p-4 ${r.enabled ? '' : 'opacity-60'}`}>
              <div className="flex flex-col"><IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-4" aria-hidden="true" /></IconButton><IconButton label="Move down" disabled={i === reviews.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" aria-hidden="true" /></IconButton></div>
              <div className="min-w-0 flex-1 basis-64"><div className="flex items-center gap-3"><Stars n={r.rating} /><span className="text-sm font-semibold">{r.reviewerName}</span>{r.source ? <Badge>{r.source}</Badge> : null}{r.featured ? <Badge tone="amber">Featured</Badge> : null}</div><p className="mt-1.5 text-sm text-stone-600">{r.text}</p></div>
              <div className="flex items-center gap-2"><Switch checked={r.enabled} onChange={(v) => patch(r, { enabled: v })} label={`${r.reviewerName} visible`} /><IconButton label="Edit review" onClick={() => setEditing(r)}><Pencil className="size-4" aria-hidden="true" /></IconButton><IconButton label="Delete review" onClick={() => setDeleting(r)}><Trash2 className="size-4 text-red-600" aria-hidden="true" /></IconButton></div>
            </div>
          ))}
        </Card>
      )}
      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing === 'new' ? 'Add a review' : 'Edit review'}>
        {editing ? <ReviewForm key={editing.id || 'new'} review={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload({ silent: true }); }} /> : null}
      </Modal>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete this review?" description="It will be removed from the website." onConfirm={async () => { await reviewApi.remove(deleting.id); toast.success('Review deleted.'); reload({ silent: true }); }} />
    </>
  );
}
