import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAsync } from '../../hooks/useAsync.js';
import { siteApi } from '../../services/index.js';
import { notifyError } from '../../utils/errors.js';
import FileField from '../../components/admin/ui/FileField.jsx';
import { Button, Card, ErrorPanel, Field, Loading, PageHeader, ProgressBar, applyServerErrors, inputCls } from '../../components/admin/ui/kit.jsx';

function SettingsForm({ settings, onSaved }) {
  const [files, setFiles] = useState({});
  const [removed, setRemoved] = useState({});
  const [progress, setProgress] = useState(null);
  const s = settings;
  const { register, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { siteTitle: s.siteTitle, titleTemplate: s.titleTemplate, metaDescription: s.metaDescription, keywords: (s.keywords || []).join(', '), footerTagline: s.footerTagline, footerNote: s.footerNote, copyrightName: s.copyrightName, themeColor: s.themeColor || '#0c1611' },
  });
  const fileProps = (k, label, hint) => ({ kind: 'image', label, hint, current: s[k], file: files[k], removed: !!removed[k], onFile: (f) => setFiles((x) => ({ ...x, [k]: f })), onRemoved: (r) => setRemoved((x) => ({ ...x, [k]: r })) });
  const desc = watch('metaDescription') || '';
  const submit = async (v) => {
    const any = Object.values(files).some(Boolean);
    setProgress(any ? 0 : null);
    try {
      const payload = { ...v, keywords: v.keywords.split(',').map((k) => k.trim()).filter(Boolean), removeLogo: !!removed.logo && !files.logo, removeFavicon: !!removed.favicon && !files.favicon, removeSeoImage: !!removed.seoImage && !files.seoImage };
      const saved = await siteApi.saveSettings(payload, files, setProgress);
      toast.success('Site settings saved. Visitors see the change on their next page load.');
      setFiles({}); setRemoved({}); setProgress(null); onSaved(saved);
    } catch (err) { applyServerErrors(err, setError); notifyError(err); setProgress(null); }
  };
  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
      <Card className="space-y-5 p-6">
        <h2 className="font-semibold">Search & sharing (SEO)</h2>
        <Field label="Default page title" htmlFor="s-title" required error={errors.siteTitle?.message}><input id="s-title" className={inputCls} {...register('siteTitle', { required: 'Site title is required' })} /></Field>
        <Field label="Title pattern for inner pages" htmlFor="s-tpl" hint="%s is replaced by the page name, e.g. Menu | Agama Cafe & Bar."><input id="s-tpl" className={inputCls} {...register('titleTemplate')} /></Field>
        <Field label="Meta description" htmlFor="s-desc" error={errors.metaDescription?.message} hint={`${desc.length}/320 — about 150–160 reads best in Google.`}><textarea id="s-desc" rows={3} className={inputCls + ' py-2.5'} {...register('metaDescription', { maxLength: { value: 320, message: 'Keep this under 320 characters' } })} /></Field>
        <Field label="Keywords" htmlFor="s-kw" hint="Separate with commas."><input id="s-kw" className={inputCls} {...register('keywords')} /></Field>
        <FileField {...fileProps('seoImage', 'Social sharing image', 'Shown when the site is shared on WhatsApp, Facebook, etc. Landscape works best.')} />
      </Card>
      <Card className="space-y-5 p-6">
        <h2 className="font-semibold">Branding</h2>
        <FileField {...fileProps('logo', 'Logo', 'Optional. Replaces the leaf mark in the header. A square image works best.')} />
        <FileField {...fileProps('favicon', 'Favicon', 'Optional. The small icon in the browser tab. Square PNG, at least 64×64.')} />
        <Field label="Browser theme colour" htmlFor="s-color" error={errors.themeColor?.message} hint="Colours the address bar on phones.">
          <div className="flex items-center gap-3"><input aria-label="Pick colour" type="color" value={watch('themeColor')} onChange={(e) => setValue('themeColor', e.target.value)} className="size-11 cursor-pointer rounded-lg border border-stone-300 bg-white p-1" /><input id="s-color" className={`${inputCls} max-w-40`} {...register('themeColor', { pattern: { value: /^#[0-9a-f]{6}$/i, message: 'Use a hex colour like #0c1611' } })} /></div>
        </Field>
      </Card>
      <Card className="grid gap-5 p-6 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Footer</h2>
        <Field label="Footer tagline" htmlFor="s-ft"><input id="s-ft" className={inputCls} {...register('footerTagline')} /></Field>
        <Field label="Footer note" htmlFor="s-fn"><input id="s-fn" className={inputCls} {...register('footerNote')} /></Field>
        <Field label="Copyright name" htmlFor="s-cn"><input id="s-cn" className={inputCls} {...register('copyrightName')} /></Field>
      </Card>
      <ProgressBar value={progress} />
      <div className="sticky bottom-4 flex justify-end"><Button type="submit" loading={isSubmitting} className="shadow-lg">Save settings</Button></div>
    </form>
  );
}

export default function SiteSettings() {
  const { data, loading, error, reload, setData } = useAsync(() => siteApi.bootstrap(), []);
  return (
    <>
      <PageHeader title="Site settings" description="How the website appears in search results, social shares and the browser." />
      {loading ? <Loading /> : error ? <ErrorPanel error={error} onRetry={reload} /> : <SettingsForm key={data.settings.updatedAt} settings={data.settings} onSaved={(settings) => setData((d) => ({ ...d, settings }))} />}
    </>
  );
}
