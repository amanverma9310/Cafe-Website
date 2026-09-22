import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Plus, Trash2, Video } from 'lucide-react';
import { contentApi } from '../../services/index.js';
import { notifyError } from '../../utils/errors.js';
import { fileSize, mediaSrc } from '../../utils/media.js';
import CtaEditor from './ui/CtaEditor.jsx';
import FileField from './ui/FileField.jsx';
import { Badge, Button, ConfirmDialog, Field, IconButton, ModalFooter, ProgressBar, SwitchField, applyServerErrors, inputCls } from './ui/kit.jsx';

const ICONS = ['leaf', 'wheat-off', 'salad', 'coffee', 'package', 'calendar', 'map-pin', 'sprout', 'heart', 'star', 'utensils'];
const LONG = new Set(['copy', 'note', 'quote', 'title']);

export const SECTIONS = {
  about: { label: 'About', hint: 'Intro text with two photos.', fields: ['eyebrow', 'title', 'copy', 'badge', 'tagline'], highlights: true, ctas: true, images: { max: 2, label: 'Photos' } },
  featuredMenu: { label: 'From the menu', hint: 'Lists dishes marked “Featured” in Menu items.', fields: ['eyebrow', 'title', 'copy'], ctas: true },
  dietaryMenus: { label: 'Dietary menus', hint: 'One card per dietary menu (Dietary menus & PDFs).', fields: ['eyebrow', 'title', 'copy', 'note'], ctas: true },
  featuredDishes: { label: 'Popular dishes (scroll showcase)', hint: 'Full-screen scroll showcase. One photo per dish (the caption becomes the dish name). Add a short clip under any photo and it plays, muted and looping, while that dish is on screen.', fields: ['eyebrow', 'title', 'copy'], ctas: true, images: { max: 10, label: 'Dishes', captions: true } },
  ambience: { label: 'The cafe (photo grid)', hint: 'A photo collage of the space.', fields: ['eyebrow', 'title', 'copy'], ctas: true, images: { max: 4, label: 'Photos — the first one is shown large' } },
  reel: { label: 'Video reel', hint: 'A portrait (phone-shaped) video. It appears on the website only when a video is uploaded AND this section is switched on.', fields: ['eyebrow', 'title', 'copy'], ctas: true, video: true },
  whyChoose: { label: 'Why Agama', hint: 'A grid of short highlights with icons.', fields: ['eyebrow', 'title'], items: true },
  reviews: { label: 'Reviews & opening hours', hint: 'Guest impressions + the hours card. Individual reviews are managed under Reviews.', fields: ['eyebrow', 'quote', 'quoteNote', 'tagline', 'title'], labels: { eyebrow: 'Guest impressions label', quote: 'Summary shown when there are no reviews', quoteNote: 'Footnote under the summary', tagline: 'Hours label', title: 'Hours heading' } },
  visit: { label: 'Visit', hint: 'Address card. Address and phone come from Business information.', fields: ['eyebrow', 'title', 'badge'], images: { max: 1, label: 'Photo' } },
  cta: { label: 'Closing call to action', hint: 'The big banner near the bottom.', fields: ['eyebrow', 'title', 'copy'], ctas: true, images: { max: 1, label: 'Background photo' } },
};
const LABELS = { eyebrow: 'Small heading above', title: 'Heading', copy: 'Paragraph', note: 'Small note', badge: 'Badge', tagline: 'Tagline', quote: 'Summary quote', quoteNote: 'Quote footnote' };

export const sectionPayload = (s) => ({
  enabled: s.enabled, eyebrow: s.eyebrow ?? '', title: s.title ?? '', copy: s.copy ?? '', note: s.note ?? '', badge: s.badge ?? '', tagline: s.tagline ?? '', quote: s.quote ?? '', quoteNote: s.quoteNote ?? '',
  highlights: s.highlights ?? [], items: s.items ?? [], ctas: s.ctas ?? [],
});

function ImageRow({ image, index, count, sectionKey, captions, ids, onChange }) {
  const [alt, setAlt] = useState(image.alt || '');
  const [caption, setCaption] = useState(image.caption || '');
  const [blend, setBlend] = useState(!!image.blend);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [clipError, setClipError] = useState('');
  const dirty = alt !== (image.alt || '') || caption !== (image.caption || '') || blend !== !!image.blend;
  const run = async (fn, ok) => { setBusy(true); try { onChange(await fn()); if (ok) toast.success(ok); } catch (e) { notifyError(e); } finally { setBusy(false); setProgress(null); } };
  const move = (d) => { const next = [...ids]; [next[index], next[index + d]] = [next[index + d], next[index]]; run(() => contentApi.reorderImages(sectionKey, next)); };
  const pickClip = (f) => {
    if (!f) return;
    if (!/^video\/(mp4|quicktime|webm)$/.test(f.type)) return setClipError(`“${f.name}” isn’t a video. Choose an MP4, MOV or WEBM file.`);
    if (f.size > 60 * 1048576) return setClipError(`“${f.name}” is ${fileSize(f.size)}. The limit is 60 MB — trim or compress the clip.`);
    setClipError(''); setProgress(0);
    run(() => contentApi.setImageVideo(sectionKey, image.id, f, setProgress), 'Clip uploaded.');
  };
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-stone-200 p-3">
      <div className="flex flex-col"><IconButton label="Move up" disabled={busy || index === 0} onClick={() => move(-1)}><ArrowUp className="size-4" aria-hidden="true" /></IconButton><IconButton label="Move down" disabled={busy || index === count - 1} onClick={() => move(1)}><ArrowDown className="size-4" aria-hidden="true" /></IconButton></div>
      <img src={mediaSrc(image.secureUrl)} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
      <div className="grid min-w-0 flex-1 basis-56 gap-2">
        <input aria-label="Photo description" placeholder="Photo description" value={alt} onChange={(e) => setAlt(e.target.value)} className={inputCls} />
        {captions ? <input aria-label="Dish name" placeholder="Dish name (caption)" value={caption} onChange={(e) => setCaption(e.target.value)} className={inputCls} /> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {dirty ? <Button size="sm" loading={busy} onClick={() => run(() => contentApi.updateImage(sectionKey, image.id, { alt, caption, blend }, null), 'Saved.')}>Save text</Button> : null}
        <label className="inline-flex min-h-9 cursor-pointer items-center rounded-lg border border-stone-300 px-3 text-sm font-semibold hover:bg-stone-100">Replace photo<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) run(() => contentApi.updateImage(sectionKey, image.id, { alt, caption, blend }, f), 'Photo replaced.'); }} /></label>
        <IconButton label="Delete photo" onClick={() => setConfirm(true)}><Trash2 className="size-4 text-red-600" aria-hidden="true" /></IconButton>
      </div>
      {captions ? (
        <div className="basis-full space-y-2 rounded-lg bg-stone-50 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex items-center gap-2 text-sm font-medium"><Video className="size-4" aria-hidden="true" /> Dish clip</p>
            {image.video?.secureUrl ? <Badge tone="green">Clip attached</Badge> : <Badge>No clip — the photo is shown</Badge>}
            <label className="inline-flex min-h-9 cursor-pointer items-center rounded-lg border border-stone-300 bg-white px-3 text-sm font-semibold hover:bg-stone-100">{image.video?.secureUrl ? 'Replace clip' : 'Add clip'}<input type="file" accept="video/mp4,video/quicktime,video/webm" className="sr-only" aria-label={`${image.video?.secureUrl ? 'Replace' : 'Add'} clip for ${image.caption || 'this dish'}`} onChange={(e) => { pickClip(e.target.files?.[0]); e.target.value = ''; }} /></label>
            {image.video?.secureUrl ? <Button variant="ghost" size="sm" onClick={() => run(() => contentApi.deleteImageVideo(sectionKey, image.id), 'Clip removed.')}>Remove clip</Button> : null}
          </div>
          {image.video?.secureUrl ? <label className="flex items-start gap-2 text-sm text-stone-700"><input type="checkbox" className="mt-1" checked={blend} onChange={(e) => setBlend(e.target.checked)} /> <span>The clip was filmed on a <strong>black background</strong> — blend it into the page (no frame). Press “Save text” after changing this.</span></label> : <p className="text-xs text-stone-500">Short (3–8 s), silent, looping. Square or 4:3 works best. MP4, MOV or WEBM up to 60 MB.</p>}
          {clipError ? <p role="alert" className="text-sm text-red-600">{clipError}</p> : null}
          <ProgressBar value={progress} />
        </div>
      ) : null}
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Delete this photo?" description="It will be removed from the website and from media storage, together with its clip if it has one." onConfirm={async () => onChange(await contentApi.deleteImage(sectionKey, image.id))} />
    </li>
  );
}

function ImagesPanel({ section, cfg, onChange }) {
  const [file, setFile] = useState(null);
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [progress, setProgress] = useState(null);
  const images = section.images || [];
  const add = async () => {
    setProgress(0);
    try { onChange(await contentApi.addImage(section.key, { alt, caption }, file, setProgress)); toast.success('Photo added.'); setFile(null); setAlt(''); setCaption(''); } catch (e) { notifyError(e); } finally { setProgress(null); }
  };
  return (
    <section className="space-y-3 border-t border-stone-200 pt-6" aria-label={cfg.label}>
      <div className="flex items-center justify-between"><h3 className="font-semibold">{cfg.label}</h3><Badge>{images.length}/{cfg.max}</Badge></div>
      <p className="text-sm text-stone-500">Photo changes are saved immediately.</p>
      <ul className="space-y-2">{images.map((im, i) => <ImageRow key={im.id} image={im} index={i} count={images.length} ids={images.map((x) => x.id)} sectionKey={section.key} captions={cfg.captions} onChange={onChange} />)}</ul>
      {images.length < cfg.max ? (
        <div className="space-y-3 rounded-lg bg-stone-50 p-4">
          <FileField kind="image" label="Add a photo" file={file} onFile={setFile} pendingText="ready — press Upload photo" />
          <div className="grid gap-3 sm:grid-cols-2"><input aria-label="New photo description" placeholder="Photo description" value={alt} onChange={(e) => setAlt(e.target.value)} className={inputCls} />{cfg.captions ? <input aria-label="New dish name" placeholder="Dish name (caption)" value={caption} onChange={(e) => setCaption(e.target.value)} className={inputCls} /> : null}</div>
          <ProgressBar value={progress} />
          <Button size="sm" disabled={!file} loading={progress !== null} onClick={add}>Upload photo</Button>
        </div>
      ) : <p className="text-sm text-stone-500">This section is full. Delete a photo to add another.</p>}
    </section>
  );
}

function VideoPanel({ section, onChange }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const video = section.video;
  const upload = async () => {
    setProgress(0);
    try { onChange(await contentApi.setVideo(section.key, file, setProgress)); toast.success('Video uploaded.'); setFile(null); } catch (e) { notifyError(e); } finally { setProgress(null); }
  };
  return (
    <section className="space-y-3 border-t border-stone-200 pt-6" aria-label="Video">
      <h3 className="font-semibold">Video</h3>
      <p className="text-sm text-stone-500">Upload a portrait (9:16) video from your device — MP4, MOV or WEBM up to 60 MB. Only upload footage you own or have permission to use. Saved immediately.</p>
      {video?.secureUrl ? (
        <div className="flex flex-wrap items-start gap-4">
          <video src={mediaSrc(video.secureUrl)} controls muted playsInline preload="metadata" className="aspect-[9/16] max-h-72 rounded-xl bg-stone-900" aria-label="Current video" />
          <div className="space-y-2"><Badge tone="green">Video uploaded</Badge><p className="text-sm text-stone-500">Upload another file below to replace it.</p><Button variant="secondary" size="sm" onClick={() => setConfirm(true)}><Trash2 className="size-4 text-red-600" aria-hidden="true" /> Remove video</Button></div>
        </div>
      ) : null}
      <FileField kind="video" label={video?.secureUrl ? 'Replace video' : 'Choose a video'} file={file} onFile={setFile} pendingText="ready — press Upload video" />
      <ProgressBar value={progress} />
      <Button size="sm" disabled={!file} loading={progress !== null} onClick={upload}>Upload video</Button>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Remove the video?" description="The section will disappear from the website until you upload another video." onConfirm={async () => { onChange(await contentApi.deleteVideo(section.key)); toast.success('Video removed.'); }} />
    </section>
  );
}

/** Edits one home-page section: text and buttons save together; photos and video are saved as you go. */
export default function SectionEditor({ section: initial, onSaved, onClose }) {
  const cfg = SECTIONS[initial.key];
  const [section, setSection] = useState(initial);
  const { register, control, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting } } = useForm({ defaultValues: sectionPayload(initial) });
  const highlights = useFieldArray({ control, name: 'highlights' });
  const items = useFieldArray({ control, name: 'items' });
  const changed = (s) => { setSection(s); onSaved(s); };

  const submit = async (v) => {
    try { const saved = await contentApi.saveSection(section.key, v); toast.success('Section saved.'); onSaved(saved); onClose(); }
    catch (err) { applyServerErrors(err, setError); notifyError(err); }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-600">{cfg.hint}</p>
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
        <SwitchField label="Show on the website" checked={watch('enabled')} onChange={(v) => setValue('enabled', v)} />
        {cfg.fields.map((f) => (
          <Field key={f} label={cfg.labels?.[f] || LABELS[f]} htmlFor={`s-${f}`} error={errors[f]?.message} hint={f === 'title' ? 'Tip: press Enter (or use a comma) to control where the italic second line starts.' : undefined}>
            {LONG.has(f) ? <textarea id={`s-${f}`} rows={f === 'title' ? 2 : 3} className={inputCls + ' py-2.5'} {...register(f)} /> : <input id={`s-${f}`} className={inputCls} {...register(f)} />}
          </Field>
        ))}
        {cfg.highlights ? (
          <fieldset className="space-y-3"><legend className="text-sm font-medium">Highlights</legend>
            {highlights.fields.map((h, i) => (
              <div key={h.id} className="grid gap-3 rounded-lg border border-stone-200 p-3 sm:grid-cols-[1fr_2fr_auto]">
                <input aria-label={`Highlight ${i + 1} title`} placeholder="Title" className={inputCls} {...register(`highlights.${i}.title`, { required: true })} />
                <input aria-label={`Highlight ${i + 1} text`} placeholder="Short text" className={inputCls} {...register(`highlights.${i}.text`)} />
                <IconButton label={`Remove highlight ${i + 1}`} onClick={() => highlights.remove(i)}><Trash2 className="size-4" aria-hidden="true" /></IconButton>
              </div>
            ))}
            {highlights.fields.length < 6 ? <Button variant="secondary" size="sm" onClick={() => highlights.append({ title: '', text: '' })}><Plus className="size-4" aria-hidden="true" /> Add highlight</Button> : null}
          </fieldset>
        ) : null}
        {cfg.items ? (
          <fieldset className="space-y-3"><legend className="text-sm font-medium">Items</legend>
            {items.fields.map((h, i) => (
              <div key={h.id} className="grid gap-3 rounded-lg border border-stone-200 p-3 sm:grid-cols-[2fr_1fr_auto]">
                <input aria-label={`Item ${i + 1} title`} placeholder="Title" className={inputCls} {...register(`items.${i}.title`, { required: true })} />
                <select aria-label={`Item ${i + 1} icon`} className={inputCls} {...register(`items.${i}.icon`)}>{ICONS.map((ic) => <option key={ic}>{ic}</option>)}</select>
                <IconButton label={`Remove item ${i + 1}`} onClick={() => items.remove(i)}><Trash2 className="size-4" aria-hidden="true" /></IconButton>
              </div>
            ))}
            {items.fields.length < 12 ? <Button variant="secondary" size="sm" onClick={() => items.append({ title: '', icon: 'leaf' })}><Plus className="size-4" aria-hidden="true" /> Add item</Button> : null}
          </fieldset>
        ) : null}
        {cfg.ctas ? <CtaEditor control={control} register={register} errors={errors} /> : null}
        <ModalFooter><Button variant="secondary" onClick={onClose}>Close</Button><Button type="submit" loading={isSubmitting}>Save text & buttons</Button></ModalFooter>
      </form>
      {cfg.images ? <ImagesPanel section={section} cfg={cfg.images} onChange={changed} /> : null}
      {cfg.video ? <VideoPanel section={section} onChange={changed} /> : null}
    </div>
  );
}
