import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync.js';
import { siteApi } from '../../services/index.js';
import { notifyError } from '../../utils/errors.js';
import { Button, Card, ErrorPanel, Field, IconButton, Loading, PageHeader, SwitchField, applyServerErrors, inputCls } from '../../components/admin/ui/kit.jsx';

const num = (v) => (v === '' || Number.isNaN(v) ? 0 : Number(v));
const Section = ({ title, hint, children }) => (
  <Card className="p-6"><h2 className="font-semibold text-stone-900">{title}</h2>{hint ? <p className="mt-0.5 text-sm text-stone-500">{hint}</p> : null}<div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div></Card>
);

function BusinessForm({ business, onSaved }) {
  const b = business;
  const { register, control, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting, isDirty } } = useForm({
    defaultValues: { ...b, rating: b.rating ?? 0, reviewCount: b.reviewCount ?? 0, addressParts: { streetAddress: '', locality: '', region: '', postalCode: '', country: 'IN', ...b.addressParts }, links: { maps: '', reservation: '', instagram: '', facebook: '', orderOnline: '', other: [], ...b.links } },
  });
  const other = useFieldArray({ control, name: 'links.other' });
  const submit = async (v) => {
    try {
      const saved = await siteApi.saveBusiness({ ...v, rating: num(v.rating), reviewCount: Math.round(num(v.reviewCount)) });
      toast.success('Business information saved.'); onSaved(saved);
    } catch (err) { applyServerErrors(err, setError); notifyError(err); }
  };
  const e = errors;
  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
      <Section title="Identity">
        <Field label="Cafe name" htmlFor="b-name" required error={e.name?.message}><input id="b-name" className={inputCls} {...register('name', { required: 'Cafe name is required' })} /></Field>
        <Field label="Name in Hindi" htmlFor="b-hi"><input id="b-hi" lang="hi" className={inputCls} {...register('hindiName')} /></Field>
        <Field label="Strapline" htmlFor="b-str" className="sm:col-span-2"><input id="b-str" className={inputCls} {...register('strapline')} /></Field>
        <Field label="Category" htmlFor="b-cat"><input id="b-cat" className={inputCls} {...register('category')} /></Field>
        <Field label="Typical spend" htmlFor="b-spend"><input id="b-spend" className={inputCls} placeholder="₹600–₹1,400 per person" {...register('spend')} /></Field>
      </Section>
      <Section title="Rating" hint="Shown on the home page and in Google search results markup. Keep it accurate.">
        <Field label="Rating (0–5)" htmlFor="b-rate" error={e.rating?.message}><input id="b-rate" type="number" step="0.1" min="0" max="5" className={inputCls} {...register('rating', { min: { value: 0, message: '0 to 5' }, max: { value: 5, message: '0 to 5' } })} /></Field>
        <Field label="Number of reviews" htmlFor="b-rc"><input id="b-rc" type="number" min="0" className={inputCls} {...register('reviewCount')} /></Field>
      </Section>
      <Section title="Contact">
        <Field label="Phone (for dialling)" htmlFor="b-ph" hint="With country code, e.g. +919654007980"><input id="b-ph" type="tel" className={inputCls} {...register('phone')} /></Field>
        <Field label="Phone (as displayed)" htmlFor="b-dph"><input id="b-dph" className={inputCls} placeholder="+91 96540 07980" {...register('displayPhone')} /></Field>
        <Field label="Reservation notes" htmlFor="b-res" className="sm:col-span-2" hint="Optional text shown next to the enquiry form."><textarea id="b-res" rows={2} className={inputCls + ' py-2.5'} {...register('reservationInfo')} /></Field>
      </Section>
      <Section title="Address">
        <Field label="Full address" htmlFor="b-addr" className="sm:col-span-2"><textarea id="b-addr" rows={2} className={inputCls + ' py-2.5'} {...register('address')} /></Field>
        <Field label="Short address" htmlFor="b-sa"><input id="b-sa" className={inputCls} {...register('shortAddress')} /></Field>
        <Field label="Plus code" htmlFor="b-pc"><input id="b-pc" className={inputCls} {...register('plusCode')} /></Field>
        <Field label="Street" htmlFor="b-st"><input id="b-st" className={inputCls} {...register('addressParts.streetAddress')} /></Field>
        <Field label="City" htmlFor="b-city"><input id="b-city" className={inputCls} {...register('addressParts.locality')} /></Field>
        <Field label="State" htmlFor="b-state"><input id="b-state" className={inputCls} {...register('addressParts.region')} /></Field>
        <Field label="PIN code" htmlFor="b-pin"><input id="b-pin" className={inputCls} {...register('addressParts.postalCode')} /></Field>
      </Section>
      <Section title="Links" hint="Full web addresses starting with https://. Leave blank to hide.">
        <Field label="Google Maps directions" htmlFor="b-maps" className="sm:col-span-2" error={e.links?.maps?.message}><input id="b-maps" type="url" className={inputCls} {...register('links.maps')} /></Field>
        <Field label="Instagram" htmlFor="b-ig" error={e.links?.instagram?.message}><input id="b-ig" type="url" className={inputCls} {...register('links.instagram')} /></Field>
        <Field label="Facebook" htmlFor="b-fb" error={e.links?.facebook?.message}><input id="b-fb" type="url" className={inputCls} {...register('links.facebook')} /></Field>
        <Field label="Reservation page" htmlFor="b-rl" hint="Site path like /contact#enquiry or a full link."><input id="b-rl" className={inputCls} {...register('links.reservation')} /></Field>
        <div className="sm:col-span-2 space-y-3">
          <p className="text-sm font-medium text-stone-800">Other links</p>
          {other.fields.map((f, i) => (
            <div key={f.id} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
              <input aria-label={`Link ${i + 1} label`} placeholder="Label" className={inputCls} {...register(`links.other.${i}.label`, { required: true })} />
              <input aria-label={`Link ${i + 1} address`} type="url" placeholder="https://" className={inputCls} {...register(`links.other.${i}.url`, { required: true })} />
              <IconButton label={`Remove link ${i + 1}`} onClick={() => other.remove(i)}><Trash2 className="size-4" aria-hidden="true" /></IconButton>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => other.append({ label: '', url: '' })}><Plus className="size-4" aria-hidden="true" /> Add link</Button>
        </div>
      </Section>
      <SwitchField label="WhatsApp enabled" hint="Reserved for a future WhatsApp button. Leave off unless the cafe uses WhatsApp for bookings." checked={watch('whatsappEnabled')} onChange={(v) => setValue('whatsappEnabled', v, { shouldDirty: true })} />
      <div className="sticky bottom-4 flex justify-end"><Button type="submit" loading={isSubmitting} disabled={!isDirty} className="shadow-lg">Save changes</Button></div>
    </form>
  );
}

export default function Business() {
  const { data, loading, error, reload, setData } = useAsync(() => siteApi.bootstrap(), []);
  return (
    <>
      <PageHeader title="Business information" description="Name, contact details, address and links used across the website footer, contact page and search results." />
      {loading ? <Loading /> : error ? <ErrorPanel error={error} onRetry={reload} /> : <BusinessForm key={data.business.updatedAt} business={data.business} onSaved={(business) => setData((d) => ({ ...d, business }))} />}
    </>
  );
}
