import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAsync } from '../../hooks/useAsync.js';
import { contentApi } from '../../services/index.js';
import { notifyError } from '../../utils/errors.js';
import CtaEditor from './ui/CtaEditor.jsx';
import FileField from './ui/FileField.jsx';
import { Button, Card, ErrorPanel, Field, Loading, ProgressBar, SwitchField, applyServerErrors, inputCls } from './ui/kit.jsx';

function Form({ pageKey, hero }) {
  const isHome = pageKey === 'home';
  const [files, setFiles] = useState({});
  const [removed, setRemoved] = useState({});
  const [progress, setProgress] = useState(null);
  const { register, control, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { eyebrow: hero?.eyebrow ?? '', title: hero?.title ?? '', copy: hero?.copy ?? '', topLeft: hero?.topLeft ?? '', topRight: hero?.topRight ?? '', showStats: hero?.showStats ?? true, imageAlt: hero?.image?.alt ?? '', ctas: hero?.ctas ?? [] },
  });
  const fp = (k, label, kind, hint) => ({ kind, label, hint, current: hero?.[k], file: files[k], removed: !!removed[k], onFile: (f) => setFiles((x) => ({ ...x, [k]: f })), onRemoved: (r) => setRemoved((x) => ({ ...x, [k]: r })) });

  const submit = async (v) => {
    setProgress(Object.values(files).some(Boolean) ? 0 : null);
    try {
      const payload = { eyebrow: v.eyebrow, title: v.title, copy: v.copy, imageAlt: v.imageAlt, removeImage: !!removed.image && !files.image, removeVideo: !!removed.video && !files.video, removeSecondaryImage: !!removed.secondaryImage && !files.secondaryImage };
      if (isHome) Object.assign(payload, { topLeft: v.topLeft, topRight: v.topRight, showStats: v.showStats, ctas: v.ctas });
      await contentApi.saveHero(pageKey, payload, files, setProgress);
      toast.success('Banner saved.'); setFiles({}); setRemoved({}); setProgress(null);
    } catch (err) { applyServerErrors(err, setError); notifyError(err); setProgress(null); }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
      <Card className="space-y-5 p-6">
        <Field label="Small heading above the title" htmlFor="h-eye"><input id="h-eye" className={inputCls} {...register('eyebrow')} /></Field>
        <Field label="Heading" htmlFor="h-title" required error={errors.title?.message} hint="Press Enter for a line break — the second line is shown in italic gold.">
          <textarea id="h-title" rows={2} aria-invalid={!!errors.title} className={inputCls + ' py-2.5'} {...register('title', { required: 'Heading is required', maxLength: { value: 160, message: 'Keep this under 160 characters' } })} />
        </Field>
        <Field label="Paragraph" htmlFor="h-copy" error={errors.copy?.message}><textarea id="h-copy" rows={3} className={inputCls + ' py-2.5'} {...register('copy', { maxLength: { value: 400, message: 'Keep this under 400 characters' } })} /></Field>
        {isHome ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Top-left line" htmlFor="h-tl"><input id="h-tl" className={inputCls} {...register('topLeft')} /></Field>
              <Field label="Top-right line" htmlFor="h-tr"><input id="h-tr" className={inputCls} {...register('topRight')} /></Field>
            </div>
            <SwitchField label="Show the rating strip" hint="Google rating, spend, cuisine and hours along the bottom." checked={watch('showStats')} onChange={(v) => setValue('showStats', v)} />
            <CtaEditor control={control} register={register} errors={errors} />
          </>
        ) : null}
      </Card>
      <Card className="space-y-5 p-6">
        <FileField {...fp('image', 'Background photo', 'image', 'Wide, high-resolution photos look best (at least 1600 px across).')} />
        <Field label="Photo description" htmlFor="h-alt" hint="For screen readers. Leave empty if the photo is purely decorative."><input id="h-alt" className={inputCls} {...register('imageAlt')} /></Field>
        {isHome ? <FileField {...fp('video', 'Background video', 'video', 'Optional. Plays silently behind the heading on the home page; the photo shows while it loads and for visitors who prefer reduced motion. Keep it short (under 30 seconds).')} /> : null}
        {pageKey === 'contact' ? <FileField {...fp('secondaryImage', 'Location card photo', 'image', 'Shown next to the address on the Contact page.')} /> : null}
        <ProgressBar value={progress} />
      </Card>
      <div className="flex justify-end"><Button type="submit" loading={isSubmitting}>Save banner</Button></div>
    </form>
  );
}

export default function HeroForm({ pageKey }) {
  const { data, loading, error, reload } = useAsync(async () => {
    try { return await contentApi.hero(pageKey); } catch (e) { if (e.status === 404) return null; throw e; }
  }, [pageKey]);
  if (loading) return <Loading />;
  if (error) return <ErrorPanel error={error} onRetry={reload} />;
  return <Form key={`${pageKey}-${data?.updatedAt}`} pageKey={pageKey} hero={data} />;
}
