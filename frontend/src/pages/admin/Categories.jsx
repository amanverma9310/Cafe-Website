import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync.js';
import { menuApi } from '../../services/index.js';
import { notifyError } from '../../utils/errors.js';
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorPanel, Field, IconButton, Loading, Modal, ModalFooter, PageHeader, Switch, applyServerErrors, inputCls } from '../../components/admin/ui/kit.jsx';

function CategoryForm({ cat, onSaved, onCancel }) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ defaultValues: { name: cat?.name ?? '', description: cat?.description ?? '' } });
  const submit = async (v) => {
    try { await menuApi.saveCategory(cat?.id, { ...v, enabled: cat?.enabled ?? true }); toast.success(cat ? 'Category updated.' : 'Category added.'); onSaved(); }
    catch (err) { applyServerErrors(err, setError); notifyError(err); }
  };
  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
      <Field label="Name" htmlFor="c-name" required error={errors.name?.message}><input id="c-name" autoFocus aria-invalid={!!errors.name} className={inputCls} {...register('name', { required: 'Name is required', maxLength: { value: 60, message: 'Keep this under 60 characters' } })} /></Field>
      <Field label="Description" htmlFor="c-desc" hint="Optional."><input id="c-desc" className={inputCls} {...register('description')} /></Field>
      <ModalFooter><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" loading={isSubmitting}>{cat ? 'Save changes' : 'Add category'}</Button></ModalFooter>
    </form>
  );
}

export default function Categories() {
  const { data, loading, error, reload, setData } = useAsync(() => menuApi.adminCategories(), []);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [reassign, setReassign] = useState('');
  const [removeDishes, setRemoveDishes] = useState(false);
  const cats = data || [];

  const move = async (i, dir) => {
    const next = [...cats];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    const prev = cats;
    setData(next);
    try { await menuApi.reorderCategories(next.map((c) => c.id)); } catch (err) { setData(prev); notifyError(err); }
  };
  const toggle = async (c, enabled) => {
    setData((d) => d.map((x) => (x.id === c.id ? { ...x, enabled } : x)));
    try { await menuApi.saveCategory(c.id, { name: c.name, description: c.description, enabled }); } catch (err) { notifyError(err); reload({ silent: true }); }
  };
  const openDelete = (c) => { setDeleting(c); setReassign(''); setRemoveDishes(false); };
  const confirmDelete = async () => {
    if (deleting.itemCount && !reassign && !removeDishes) throw new Error('Choose where the dishes should go, or confirm deleting them too.');
    await menuApi.deleteCategory(deleting.id, removeDishes ? { deleteItems: true } : reassign ? { reassignTo: reassign } : {});
    toast.success('Category deleted.');
    reload({ silent: true });
  };

  return (
    <>
      <PageHeader title="Menu categories" description="Groups such as Soups or Desserts. The order here is the order visitors see." actions={<Button onClick={() => setEditing('new')}><Plus className="size-4" aria-hidden="true" /> Add category</Button>} />
      {loading && !data ? <Loading /> : error ? <ErrorPanel error={error} onRetry={reload} /> : cats.length === 0 ? <EmptyState title="No categories yet">Add a category, then assign dishes to it.</EmptyState> : (
        <Card className="divide-y divide-stone-100">
          {cats.map((c, i) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="flex flex-col"><IconButton label={`Move ${c.name} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-4" aria-hidden="true" /></IconButton><IconButton label={`Move ${c.name} down`} disabled={i === cats.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" aria-hidden="true" /></IconButton></div>
              <div className="min-w-0 flex-1 basis-48"><p className="font-semibold">{c.name}</p><p className="text-sm text-stone-500">{c.description || c.slug}</p></div>
              <Badge tone={c.itemCount ? 'blue' : 'neutral'}>{c.itemCount} dish{c.itemCount === 1 ? '' : 'es'}</Badge>
              <Switch checked={c.enabled} onChange={(v) => toggle(c, v)} label={`${c.name} visible`} />
              <IconButton label={`Edit ${c.name}`} onClick={() => setEditing(c)}><Pencil className="size-4" aria-hidden="true" /></IconButton>
              <IconButton label={`Delete ${c.name}`} onClick={() => openDelete(c)}><Trash2 className="size-4 text-red-600" aria-hidden="true" /></IconButton>
            </div>
          ))}
        </Card>
      )}
      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing === 'new' ? 'Add a category' : 'Edit category'}>
        {editing ? <CategoryForm key={editing.id || 'new'} cat={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload({ silent: true }); }} /> : null}
      </Modal>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title={`Delete “${deleting?.name}”?`}
        description={deleting?.itemCount ? `This category has ${deleting.itemCount} dish${deleting.itemCount === 1 ? '' : 'es'}. Move them to another category first, or delete them too.` : 'This category is empty and can be deleted safely.'} onConfirm={confirmDelete}>
        {deleting?.itemCount ? (
          <div className="mt-4 space-y-3">
            <Field label="Move dishes to" htmlFor="reassign"><select id="reassign" className={inputCls} value={reassign} disabled={removeDishes} onChange={(e) => setReassign(e.target.value)}><option value="">Choose a category…</option>{cats.filter((c) => c.id !== deleting.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <label className="flex items-start gap-2 text-sm text-red-700"><input type="checkbox" className="mt-1" checked={removeDishes} onChange={(e) => setRemoveDishes(e.target.checked)} /> Delete the {deleting.itemCount} dish{deleting.itemCount === 1 ? '' : 'es'} as well (can’t be undone)</label>
          </div>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
