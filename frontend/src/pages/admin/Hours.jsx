import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAsync } from '../../hooks/useAsync.js';
import { siteApi } from '../../services/index.js';
import { notifyError } from '../../utils/errors.js';
import { Button, Card, ErrorPanel, Field, Loading, PageHeader, Switch, applyServerErrors, inputCls } from '../../components/admin/ui/kit.jsx';

function HoursForm({ hours, onSaved }) {
  const { register, handleSubmit, watch, setValue, getValues, setError, formState: { errors, isSubmitting, isDirty } } = useForm({ defaultValues: { days: hours.days, badgeText: hours.badgeText, disclaimer: hours.disclaimer } });
  const submit = async (v) => {
    try {
      const saved = await siteApi.saveHours({ ...v, days: v.days.map((d) => ({ day: d.day, isClosed: !!d.isClosed, opensAt: d.isClosed ? '' : d.opensAt || '', closesAt: d.isClosed ? '' : d.closesAt || '', note: d.note || '' })) });
      toast.success('Opening hours saved.'); onSaved(saved);
    } catch (err) { applyServerErrors(err, setError); notifyError(err); }
  };
  const copyFirst = () => {
    const first = getValues('days.0');
    hours.days.forEach((_, i) => { if (i) ['isClosed', 'opensAt', 'closesAt', 'note'].forEach((k) => setValue(`days.${i}.${k}`, first[k], { shouldDirty: true })); });
    toast.info('Copied Monday’s hours to every day.');
  };
  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-stone-600">Use 24-hour times. Leave times empty to show the note instead (for example “Confirm timing”).</p><Button variant="secondary" size="sm" onClick={copyFirst}>Copy Monday to all days</Button></div>
        <div className="divide-y divide-stone-100">
          {hours.days.map((d, i) => {
            const closed = watch(`days.${i}.isClosed`);
            return (
              <div key={d.day} className="grid items-end gap-3 py-4 sm:grid-cols-[7rem_auto_1fr_1fr_1.4fr]">
                <p className="pb-2.5 font-semibold">{d.day}</p>
                <div className="flex items-center gap-2 pb-2.5"><Switch checked={!closed} onChange={(v) => setValue(`days.${i}.isClosed`, !v, { shouldDirty: true })} label={`${d.day} open`} /><span className="w-12 text-sm text-stone-600">{closed ? 'Closed' : 'Open'}</span></div>
                <Field label="Opens" htmlFor={`o-${i}`} error={errors.days?.[i]?.opensAt?.message}><input id={`o-${i}`} type="time" disabled={closed} className={inputCls} {...register(`days.${i}.opensAt`)} /></Field>
                <Field label="Closes" htmlFor={`c-${i}`} error={errors.days?.[i]?.closesAt?.message}><input id={`c-${i}`} type="time" disabled={closed} className={inputCls} {...register(`days.${i}.closesAt`)} /></Field>
                <Field label="Note" htmlFor={`n-${i}`}><input id={`n-${i}`} className={inputCls} placeholder="Optional" {...register(`days.${i}.note`)} /></Field>
              </div>
            );
          })}
        </div>
      </Card>
      <Card className="grid gap-5 p-6 sm:grid-cols-2">
        <Field label="Highlight badge" htmlFor="h-badge" hint="e.g. Closes at 12:00 AM"><input id="h-badge" className={inputCls} {...register('badgeText')} /></Field>
        <Field label="Small print" htmlFor="h-disc" hint="Shown under the hours."><textarea id="h-disc" rows={2} className={inputCls + ' py-2.5'} {...register('disclaimer')} /></Field>
      </Card>
      <div className="sticky bottom-4 flex justify-end"><Button type="submit" loading={isSubmitting} disabled={!isDirty} className="shadow-lg">Save opening hours</Button></div>
    </form>
  );
}

export default function Hours() {
  const { data, loading, error, reload, setData } = useAsync(() => siteApi.bootstrap(), []);
  return (
    <>
      <PageHeader title="Opening hours" description="Shown on the home page, the contact page and in search results." />
      {loading ? <Loading /> : error ? <ErrorPanel error={error} onRetry={reload} /> : <HoursForm key={data.hours.updatedAt} hours={data.hours} onSaved={(hours) => setData((d) => ({ ...d, hours }))} />}
    </>
  );
}
