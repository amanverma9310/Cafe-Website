import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import { enquiryApi } from '../../services/index.js';
import { cn } from '../../utils/cn.js';

const input = 'min-h-12 w-full rounded-xl border border-line bg-white px-4 text-fg placeholder:text-fg/35 focus:border-accent focus:outline-none aria-[invalid=true]:border-red-400';

function Field({ label, error, children, htmlFor, optional }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-fg/85">{label}{optional ? <span className="text-muted"> (optional)</span> : null}</label>
      {children}
      {error ? <p role="alert" className="mt-1.5 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export default function ContactForm() {
  const { business } = useSite();
  const [status, setStatus] = useState('idle');
  const [formError, setFormError] = useState('');
  const { register, handleSubmit, watch, reset, setError, formState: { errors } } = useForm({ defaultValues: { enquiryType: 'General enquiry' } });
  const isReservation = watch('enquiryType') === 'Reservation';
  const today = new Date().toISOString().slice(0, 10);

  const onSubmit = async (values) => {
    setStatus('loading'); setFormError('');
    try {
      await enquiryApi.submit({ ...values, preferredDate: isReservation ? values.preferredDate || '' : '' });
      setStatus('sent'); reset();
    } catch (err) {
      setStatus('error');
      if (err.details) Object.entries(err.details).forEach(([k, m]) => setError(k, { message: m }));
      setFormError(err.message);
    }
  };

  if (status === 'sent') {
    return (
      <div role="status" className="rounded-[1.75rem] border border-leaf/25 bg-surface p-10 text-center shadow-[var(--shadow-soft)]">
        <CheckCircle2 className="mx-auto size-10 text-leaf" aria-hidden="true" />
        <h3 className="display mt-5 text-3xl">Thank you. We’ve got your enquiry.</h3>
        <p className="mx-auto mt-3 max-w-md text-muted">The team will reach out on the number you shared. For anything urgent, please call {business?.displayPhone || 'the cafe'}.</p>
        <button type="button" onClick={() => setStatus('idle')} className="mt-7 min-h-11 rounded-full border border-fg/25 px-6 text-sm font-semibold transition hover:border-leaf/50 hover:bg-leaf/8">Send another</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 rounded-[1.75rem] border border-line bg-surface p-6 shadow-[var(--shadow-soft)] sm:p-10">
      {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input type="text" tabIndex={-1} autoComplete="off" {...register('website')} /></label>
      </div>
      <fieldset className="grid grid-cols-2 gap-2 rounded-full border border-line p-1">
        <legend className="sr-only">Enquiry type</legend>
        {['General enquiry', 'Reservation'].map((t) => (
          <label key={t} className={cn('flex min-h-11 cursor-pointer items-center justify-center rounded-full text-sm font-semibold transition has-[:checked]:bg-accent has-[:checked]:text-accent-ink', 'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent')}>
            <input type="radio" value={t} className="sr-only" {...register('enquiryType')} />{t === 'Reservation' ? 'Reserve a table' : 'General enquiry'}
          </label>
        ))}
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="c-name" error={errors.name?.message}>
          <input id="c-name" autoComplete="name" aria-invalid={!!errors.name} className={input} {...register('name', { required: 'Please enter your name', minLength: { value: 2, message: 'Please enter your name' } })} />
        </Field>
        <Field label="Phone number" htmlFor="c-phone" error={errors.phone?.message}>
          <input id="c-phone" type="tel" inputMode="tel" autoComplete="tel" aria-invalid={!!errors.phone} className={input} {...register('phone', { required: 'Please enter a phone number', pattern: { value: /^\+?[0-9\s()-]{7,18}$/, message: 'Enter a valid phone number' } })} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email" optional htmlFor="c-email" error={errors.email?.message}>
          <input id="c-email" type="email" autoComplete="email" aria-invalid={!!errors.email} className={input} {...register('email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' } })} />
        </Field>
        {isReservation ? (
          <Field label="Preferred date" htmlFor="c-date" error={errors.preferredDate?.message}>
            <input id="c-date" type="date" min={today} className={input} {...register('preferredDate')} />
          </Field>
        ) : null}
      </div>
      <Field label={isReservation ? 'Party size, timing and requests' : 'Your message'} htmlFor="c-msg" error={errors.message?.message}>
        <textarea id="c-msg" rows={5} aria-invalid={!!errors.message} className={cn(input, 'py-3')} {...register('message', { required: 'Please tell us a little more', minLength: { value: 10, message: 'Please add at least 10 characters' } })} />
      </Field>
      {formError && status === 'error' ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p> : null}
      <button type="submit" disabled={status === 'loading'} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-8 font-semibold text-accent-ink shadow-[0_14px_30px_-16px_rgb(214_163_93/0.7)] transition hover:-translate-y-0.5 hover:brightness-[1.07] disabled:translate-y-0 disabled:opacity-60 sm:justify-self-start">
        {status === 'loading' ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Sending…</> : 'Send enquiry'}
      </button>
    </form>
  );
}
