import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { menuApi } from '../../services/index.js';
import { formatPrice } from '../../utils/format.js';
import { notifyError } from '../../utils/errors.js';
import { mediaSrc } from '../../utils/media.js';
import FileField from '../../components/admin/ui/FileField.jsx';
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorPanel, Field, IconButton, Loading, Modal, ModalFooter, PageHeader, Pagination, ProgressBar, SearchInput, Switch, SwitchField, applyServerErrors, inputCls } from '../../components/admin/ui/kit.jsx';

function ItemForm({ item, cats, docs, onSaved, onCancel }) {
  const [file, setFile] = useState(null);
  const [removed, setRemoved] = useState(false);
  const [progress, setProgress] = useState(null);
  const { register, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: item?.name ?? '', description: item?.description ?? '', price: item?.price ?? '',
      category: item?.category?.id ?? '', menu: item?.menu?.id ?? docs[0]?.id ?? '',
      tags: (item?.dietaryTags || []).join(', '), featured: item?.featured ?? false, available: item?.available ?? true,
    },
  });
  const featured = watch('featured');
  const available = watch('available');

  const submit = async (v) => {
    setProgress(file ? 0 : null);
    try {
      const payload = {
        name: v.name, description: v.description, price: v.price === '' ? null : Number(v.price), category: v.category, menu: v.menu,
        dietaryTags: v.tags.split(',').map((t) => t.trim()).filter(Boolean), featured: v.featured, available: v.available, removeImage: removed && !file,
      };
      const saved = await menuApi.saveItem(item?.id, payload, file, setProgress);
      toast.success(item ? 'Dish updated.' : 'Dish added.');
      onSaved(saved);
    } catch (err) { applyServerErrors(err, setError); notifyError(err); setProgress(null); }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
      <Field label="Name" htmlFor="i-name" required error={errors.name?.message}><input id="i-name" aria-invalid={!!errors.name} className={inputCls} {...register('name', { required: 'Name is required', maxLength: { value: 100, message: 'Keep this under 100 characters' } })} /></Field>
      <Field label="Description" htmlFor="i-desc" error={errors.description?.message}><textarea id="i-desc" rows={3} className={inputCls + ' py-2.5'} {...register('description', { maxLength: { value: 400, message: 'Keep this under 400 characters' } })} /></Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Price (₹)" htmlFor="i-price" error={errors.price?.message} hint="Leave empty to hide the price.">
          <input id="i-price" type="number" min="0" step="1" inputMode="numeric" className={inputCls} {...register('price', { min: { value: 0, message: 'Price cannot be negative' } })} />
        </Field>
        <Field label="Menu" htmlFor="i-menu" required error={errors.menu?.message}>
          <select id="i-menu" className={inputCls} {...register('menu', { required: 'Choose a menu' })}>{docs.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}</select>
        </Field>
        <Field label="Category" htmlFor="i-cat" required error={errors.category?.message}>
          <select id="i-cat" className={inputCls} {...register('category', { required: 'Choose a category' })}><option value="">Choose…</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </Field>
      </div>
      <Field label="Dietary tags" htmlFor="i-tags" hint="Separate with commas, e.g. Gluten free, Onion & garlic free."><input id="i-tags" className={inputCls} {...register('tags')} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <SwitchField label="Featured" hint="Shown in “From the menu” on the home page." checked={featured} onChange={(v) => setValue('featured', v)} />
        <SwitchField label="Available" hint="Turn off to hide it without deleting." checked={available} onChange={(v) => setValue('available', v)} />
      </div>
      <FileField kind="image" label="Photo" current={item?.image} file={file} removed={removed} onFile={setFile} onRemoved={setRemoved} />
      <ProgressBar value={progress} />
      <ModalFooter><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" loading={isSubmitting}>{item ? 'Save changes' : 'Add dish'}</Button></ModalFooter>
    </form>
  );
}

export default function MenuItems() {
  const [q, setQ] = useState('');
  const dq = useDebounce(q);
  const [filters, setFilters] = useState({ menu: '', category: '', available: '' });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null | 'new' | item
  const [deleting, setDeleting] = useState(null);

  const refs = useAsync(async () => {
    const [cats, docs] = await Promise.all([menuApi.adminCategories(), menuApi.adminDocuments()]);
    return { cats, docs: docs.filter((d) => d.type !== 'bar') };
  }, []);
  const list = useAsync(() => menuApi.adminItems({ page, limit: 15, q: dq || undefined, menu: filters.menu || undefined, category: filters.category || undefined, available: filters.available || undefined }), [page, dq, filters]);
  useEffect(() => setPage(1), [dq, filters]);

  const items = list.data?.items || [];
  const patch = async (item, body) => {
    const prev = list.data;
    list.setData((d) => ({ ...d, items: d.items.map((i) => (i.id === item.id ? { ...i, ...body } : i)) }));
    try { await menuApi.patchItem(item.id, body); } catch (err) { list.setData(prev); notifyError(err); }
  };
  const setF = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <PageHeader title="Menu items" description="Every dish on the website. Switch a dish off to hide it, or mark it Featured to show it on the home page." actions={<Button onClick={() => setEditing('new')} disabled={!refs.data}><Plus className="size-4" aria-hidden="true" /> Add dish</Button>} />
      <Card className="mb-5 grid gap-3 p-4 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <SearchInput value={q} onChange={setQ} placeholder="Search dishes…" />
        <select aria-label="Filter by menu" value={filters.menu} onChange={setF('menu')} className={inputCls}><option value="">All menus</option>{refs.data?.docs.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}</select>
        <select aria-label="Filter by category" value={filters.category} onChange={setF('category')} className={inputCls}><option value="">All categories</option>{refs.data?.cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select aria-label="Filter by availability" value={filters.available} onChange={setF('available')} className={inputCls}><option value="">Any availability</option><option value="true">Available</option><option value="false">Hidden</option></select>
      </Card>

      {list.loading && !list.data ? <Loading /> : list.error ? <ErrorPanel error={list.error} onRetry={list.reload} /> : items.length === 0 ? (
        <EmptyState title="No dishes found" action={<Button onClick={() => setEditing('new')}>Add a dish</Button>}>Try a different search or filter, or add your first dish.</EmptyState>
      ) : (
        <Card className="divide-y divide-stone-100">
          {items.map((it) => (
            <div key={it.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-stone-100 text-lg font-bold text-stone-400">
                {it.image?.secureUrl ? <img src={mediaSrc(it.image.secureUrl)} alt="" className="size-full object-cover" /> : it.name[0]}
              </div>
              <div className="min-w-0 flex-1 basis-56">
                <p className="truncate font-semibold text-stone-900">{it.name}</p>
                <p className="truncate text-sm text-stone-500">{it.description || 'No description'}</p>
                <p className="mt-1.5 flex flex-wrap gap-1.5"><Badge>{it.menu?.title}</Badge><Badge tone="blue">{it.category?.name}</Badge>{it.dietaryTags?.map((t) => <Badge key={t} tone="green">{t}</Badge>)}</p>
              </div>
              <p className="w-16 text-right font-semibold tabular-nums">{it.price != null ? formatPrice(it.price) : '—'}</p>
              <div className="flex items-center gap-3">
                <IconButton label={it.featured ? `Unfeature ${it.name}` : `Feature ${it.name}`} aria-pressed={it.featured} onClick={() => patch(it, { featured: !it.featured })}><Star className={`size-4 ${it.featured ? 'fill-amber-400 text-amber-500' : ''}`} aria-hidden="true" /></IconButton>
                <Switch checked={it.available} onChange={(v) => patch(it, { available: v })} label={`${it.name} available`} />
                <IconButton label={`Edit ${it.name}`} onClick={() => setEditing(it)}><Pencil className="size-4" aria-hidden="true" /></IconButton>
                <IconButton label={`Delete ${it.name}`} onClick={() => setDeleting(it)}><Trash2 className="size-4 text-red-600" aria-hidden="true" /></IconButton>
              </div>
            </div>
          ))}
        </Card>
      )}
      <Pagination meta={list.data?.meta} onPage={setPage} />

      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing === 'new' ? 'Add a dish' : 'Edit dish'} size="lg">
        {editing && refs.data ? <ItemForm key={editing.id || 'new'} item={editing === 'new' ? null : editing} cats={refs.data.cats} docs={refs.data.docs} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); list.reload({ silent: true }); }} /> : null}
      </Modal>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title={`Delete “${deleting?.name}”?`} description="This removes the dish and its photo from the website. This can’t be undone." onConfirm={async () => { await menuApi.deleteItem(deleting.id); toast.success('Dish deleted.'); list.reload({ silent: true }); }} />
    </>
  );
}
