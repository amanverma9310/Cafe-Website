import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync.js';
import { contentApi } from '../../services/index.js';
import { notifyError } from '../../utils/errors.js';
import { cn } from '../../utils/cn.js';
import HeroForm from '../../components/admin/HeroForm.jsx';
import FileField from '../../components/admin/ui/FileField.jsx';
import { Button, Card, ErrorPanel, Field, IconButton, Loading, PageHeader, ProgressBar, applyServerErrors, inputCls } from '../../components/admin/ui/kit.jsx';

const ICONS = ['leaf', 'wheat-off', 'coffee', 'utensils', 'sprout', 'heart', 'star', 'map-pin'];
const TABS = [['about-content', 'About page content'], ['about', 'About banner'], ['menu', 'Menu banner'], ['dietary-menu', 'Dietary menu banner'], ['gallery', 'Gallery banner'], ['contact', 'Contact banner']];

function AboutForm({ about }) {
  const [file, setFile] = useState(null);
  const [removed, setRemoved] = useState(false);
  const [progress, setProgress] = useState(null);
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ defaultValues: { storyTitle: about.storyTitle, storyCopy: about.storyCopy, ctaLabel: about.ctaLabel, pillarsTitle: about.pillarsTitle, pillars: about.pillars || [], note: about.note } });
  const pillars = useFieldArray({ control, name: 'pillars' });
  const submit = async (v) => {
    setProgress(file ? 0 : null);
    try { await contentApi.saveAbout({ ...v, removeStoryImage: removed && !file }, { storyImage: file }, setProgress); toast.success('About page saved.'); setFile(null); setRemoved(false); setProgress(null); }
    catch (err) { applyServerErrors(err, setError); notifyError(err); setProgress(null); }
  };
  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
      <Card className="space-y-5 p-6">
        <Field label="Story heading" htmlFor="a-t" hint="Press Enter or use a comma to control the italic second line."><textarea id="a-t" rows={2} className={inputCls + ' py-2.5'} {...register('storyTitle')} /></Field>
        <Field label="Story" htmlFor="a-c" error={errors.storyCopy?.message}><textarea id="a-c" rows={5} className={inputCls + ' py-2.5'} {...register('storyCopy', { maxLength: { value: 1200, message: 'Keep this under 1200 characters' } })} /></Field>
        <Field label="Button label" htmlFor="a-b"><input id="a-b" className={inputCls} {...register('ctaLabel')} /></Field>
        <FileField kind="image" label="Story photo" current={about.storyImage} file={file} removed={removed} onFile={setFile} onRemoved={setRemoved} />
      </Card>
      <Card className="space-y-5 p-6">
        <Field label="Values heading" htmlFor="a-p"><input id="a-p" className={inputCls} {...register('pillarsTitle')} /></Field>
        <div className="space-y-3">
          {pillars.fields.map((f, i) => (
            <div key={f.id} className="grid gap-3 rounded-lg border border-stone-200 p-3 sm:grid-cols-[1fr_2fr_8rem_auto]">
              <input aria-label={`Value ${i + 1} title`} placeholder="Title" className={inputCls} {...register(`pillars.${i}.title`, { required: true })} />
              <input aria-label={`Value ${i + 1} text`} placeholder="Short text" className={inputCls} {...register(`pillars.${i}.copy`)} />
              <select aria-label={`Value ${i + 1} icon`} className={inputCls} {...register(`pillars.${i}.icon`)}>{ICONS.map((ic) => <option key={ic}>{ic}</option>)}</select>
              <IconButton label={`Remove value ${i + 1}`} onClick={() => pillars.remove(i)}><Trash2 className="size-4" aria-hidden="true" /></IconButton>
            </div>
          ))}
          {pillars.fields.length < 8 ? <Button variant="secondary" size="sm" onClick={() => pillars.append({ title: '', copy: '', icon: 'leaf' })}><Plus className="size-4" aria-hidden="true" /> Add value</Button> : null}
        </div>
        <Field label="Footnote" htmlFor="a-n" hint="e.g. a note about owner story details still to come."><textarea id="a-n" rows={2} className={inputCls + ' py-2.5'} {...register('note')} /></Field>
      </Card>
      <ProgressBar value={progress} />
      <div className="flex justify-end"><Button type="submit" loading={isSubmitting}>Save About page</Button></div>
    </form>
  );
}

function AboutContent() {
  const { data, loading, error, reload } = useAsync(() => contentApi.about(), []);
  if (loading) return <Loading />;
  if (error) return <ErrorPanel error={error} onRetry={reload} />;
  return <AboutForm key={data.updatedAt} about={data} />;
}

export default function PagesContent() {
  const [tab, setTab] = useState('about-content');
  return (
    <>
      <PageHeader title="Page banners & About" description="The large banner at the top of each inner page, and the text on the About page." />
      <div role="tablist" aria-label="Pages" className="mb-6 flex flex-wrap gap-1 rounded-lg bg-stone-200/70 p-1">
        {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} type="button" onClick={() => setTab(k)} className={cn('min-h-9 rounded-md px-3.5 text-sm font-semibold transition', tab === k ? 'bg-white shadow-sm' : 'text-stone-600 hover:text-stone-900')}>{l}</button>)}
      </div>
      {tab === 'about-content' ? <AboutContent /> : <HeroForm pageKey={tab} />}
    </>
  );
}
