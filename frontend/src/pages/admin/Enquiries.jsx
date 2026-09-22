import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Mail, MailOpen, Phone, Trash2 } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { enquiryApi } from '../../services/index.js';
import { dateOnly, dateTime } from '../../utils/format.js';
import { notifyError } from '../../utils/errors.js';
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorPanel, IconButton, Loading, Modal, PageHeader, Pagination, SearchInput, inputCls } from '../../components/admin/ui/kit.jsx';

export default function Enquiries() {
  const [q, setQ] = useState('');
  const dq = useDebounce(q);
  const [f, setF] = useState({ status: '', isRead: '', enquiryType: '' });
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { data, loading, error, reload, setData } = useAsync(() => enquiryApi.list({ page, limit: 12, q: dq || undefined, status: f.status || undefined, isRead: f.isRead || undefined, enquiryType: f.enquiryType || undefined }), [page, dq, f]);
  useEffect(() => setPage(1), [dq, f]);
  const items = data?.items || [];
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const update = async (e, body) => {
    try {
      const saved = await enquiryApi.patch(e.id, body);
      setData((d) => ({ ...d, items: d.items.map((i) => (i.id === e.id ? saved : i)), meta: { ...d.meta, unread: d.meta.unread + (body.isRead === undefined ? 0 : body.isRead ? (e.isRead ? 0 : -1) : (e.isRead ? 1 : 0)) } }));
      setOpen((cur) => (cur?.id === e.id ? saved : cur));
    } catch (err) { notifyError(err); }
  };
  const view = (e) => { setOpen(e); if (!e.isRead) update(e, { isRead: true }); };

  return (
    <>
      <PageHeader title="Contact enquiries" description={data ? `${data.meta.unread} unread · messages sent from the contact form.` : 'Messages sent from the contact form.'} />
      <Card className="mb-5 grid gap-3 p-4 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <SearchInput value={q} onChange={setQ} placeholder="Search name, phone, message…" />
        <select aria-label="Filter by status" value={f.status} onChange={set('status')} className={inputCls}><option value="">Any status</option><option value="pending">Pending</option><option value="resolved">Resolved</option></select>
        <select aria-label="Filter by read state" value={f.isRead} onChange={set('isRead')} className={inputCls}><option value="">Read &amp; unread</option><option value="false">Unread</option><option value="true">Read</option></select>
        <select aria-label="Filter by type" value={f.enquiryType} onChange={set('enquiryType')} className={inputCls}><option value="">All types</option><option>Reservation</option><option>General enquiry</option></select>
      </Card>
      {loading && !data ? <Loading /> : error ? <ErrorPanel error={error} onRetry={reload} /> : items.length === 0 ? <EmptyState title="No enquiries found">Enquiries appear here when guests use the contact form.</EmptyState> : (
        <Card className="divide-y divide-stone-100">
          {items.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center gap-3 p-4 hover:bg-stone-50">
              <button type="button" onClick={() => view(e)} className="flex min-w-0 flex-1 basis-64 flex-col items-start text-left" aria-label={`Open enquiry from ${e.name}`}>
                <span className="flex items-center gap-2 text-sm"><span className={`size-2 rounded-full ${e.isRead ? 'bg-transparent' : 'bg-red-600'}`} aria-hidden="true" /><span className={e.isRead ? 'font-medium' : 'font-bold'}>{e.name}</span><span className="text-stone-500">· {e.phone}</span></span>
                <span className="mt-0.5 line-clamp-1 w-full text-sm text-stone-500">{e.message}</span>
              </button>
              <Badge tone={e.enquiryType === 'Reservation' ? 'blue' : 'neutral'}>{e.enquiryType}</Badge>
              <Badge tone={e.status === 'resolved' ? 'green' : 'amber'}>{e.status}</Badge>
              <span className="w-32 text-right text-xs text-stone-400">{dateTime(e.createdAt)}</span>
              <IconButton label={`Delete enquiry from ${e.name}`} onClick={() => setDeleting(e)}><Trash2 className="size-4 text-red-600" aria-hidden="true" /></IconButton>
            </div>
          ))}
        </Card>
      )}
      <Pagination meta={data?.meta} onPage={setPage} />

      <Modal open={!!open} onOpenChange={(o) => !o && setOpen(null)} title={open ? `Enquiry from ${open.name}` : ''} description={open ? dateTime(open.createdAt) : ''}>
        {open ? (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-stone-500">Type</dt><dd className="font-medium">{open.enquiryType}</dd></div>
              <div><dt className="text-stone-500">Status</dt><dd><Badge tone={open.status === 'resolved' ? 'green' : 'amber'}>{open.status}</Badge></dd></div>
              <div><dt className="text-stone-500">Phone</dt><dd><a className="font-medium text-emerald-800 underline" href={`tel:${open.phone}`}>{open.phone}</a></dd></div>
              <div><dt className="text-stone-500">Email</dt><dd>{open.email ? <a className="font-medium text-emerald-800 underline" href={`mailto:${open.email}`}>{open.email}</a> : '—'}</dd></div>
              {open.preferredDate ? <div><dt className="text-stone-500">Preferred date</dt><dd className="font-medium">{dateOnly(open.preferredDate)}</dd></div> : null}
            </dl>
            <div><p className="mb-1 text-sm text-stone-500">Message</p><p className="whitespace-pre-wrap rounded-lg bg-stone-50 p-4 text-sm leading-6">{open.message}</p></div>
            <div className="flex flex-wrap justify-between gap-3 border-t border-stone-200 pt-4">
              <div className="flex gap-2">
                <a href={`tel:${open.phone}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-stone-300 px-3 text-sm font-semibold hover:bg-stone-100"><Phone className="size-4" aria-hidden="true" /> Call</a>
                <Button variant="secondary" size="sm" onClick={() => update(open, { isRead: !open.isRead })}>{open.isRead ? <><Mail className="size-4" aria-hidden="true" /> Mark unread</> : <><MailOpen className="size-4" aria-hidden="true" /> Mark read</>}</Button>
              </div>
              <Button size="sm" onClick={() => update(open, { status: open.status === 'resolved' ? 'pending' : 'resolved' })}>{open.status === 'resolved' ? 'Reopen' : 'Mark resolved'}</Button>
            </div>
          </div>
        ) : null}
      </Modal>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete this enquiry?" description={`The message from ${deleting?.name} will be permanently removed.`} onConfirm={async () => { await enquiryApi.remove(deleting.id); toast.success('Enquiry deleted.'); setOpen(null); reload({ silent: true }); }} />
    </>
  );
}
