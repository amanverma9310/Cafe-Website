import { useEffect, useId, useRef, useState } from 'react';
import { FileText, ImageIcon, Trash2, Upload, Video } from 'lucide-react';
import { Button, Field } from './kit.jsx';
import { cn } from '../../../utils/cn.js';
import { fileSize, mediaSrc, videoPoster } from '../../../utils/media.js';

const KINDS = {
  image: { accept: 'image/jpeg,image/png,image/webp', label: 'JPG, PNG or WEBP image', maxMB: 10, test: (f) => /^image\/(jpeg|png|webp)$/.test(f.type), icon: ImageIcon },
  pdf: { accept: 'application/pdf', label: 'PDF file', maxMB: 25, test: (f) => f.type === 'application/pdf', icon: FileText },
  video: { accept: 'video/mp4,video/quicktime,video/webm', label: 'MP4, MOV or WEBM video', maxMB: 60, test: (f) => /^video\/(mp4|quicktime|webm)$/.test(f.type), icon: Video },
};

/**
 * Upload from the device — there is intentionally no "paste a URL" option anywhere in the admin.
 * Controlled by { file, removed }: a newly chosen File and/or a pending removal of the current media.
 */
export default function FileField({ kind = 'image', label, hint, current, file, removed = false, onFile, onRemoved, error, required, className, pendingText = 'will upload when you save' }) {
  const id = useId();
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [localError, setLocalError] = useState('');
  const [preview, setPreview] = useState('');
  const cfg = KINDS[kind];
  const Icon = cfg.icon;

  useEffect(() => {
    if (!file || kind === 'pdf') { setPreview(''); return undefined; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, kind]);

  const pick = (f) => {
    if (!f) return;
    if (!cfg.test(f)) return setLocalError(`“${f.name}” isn’t supported. Please choose a ${cfg.label}.`);
    if (f.size > cfg.maxMB * 1048576) return setLocalError(`“${f.name}” is ${fileSize(f.size)}. The limit is ${cfg.maxMB} MB.`);
    setLocalError('');
    onRemoved?.(false);
    onFile(f);
  };

  const shownUrl = preview || (!removed && current?.secureUrl ? mediaSrc(current.secureUrl) : '');
  const hasMedia = Boolean(file || (!removed && current?.secureUrl));

  return (
    <Field label={label} htmlFor={id} hint={hint ?? `${cfg.label}, up to ${cfg.maxMB} MB.`} error={localError || error} required={required} className={className}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
        className={cn('rounded-xl border-2 border-dashed p-4 transition', drag ? 'border-emerald-600 bg-emerald-50' : 'border-stone-300 bg-stone-50')}
      >
        {hasMedia ? (
          <div className="flex items-center gap-4">
            <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-stone-200">
              {kind === 'image' && shownUrl ? <img src={shownUrl} alt="" className="size-full object-cover" /> : null}
              {kind === 'video' && shownUrl ? <video src={shownUrl} poster={videoPoster(shownUrl, 160)} muted preload="metadata" className="size-full object-cover" /> : null}
              {kind === 'pdf' || !shownUrl ? <Icon className="size-8 text-stone-500" aria-hidden="true" /> : null}
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-medium text-stone-800">{file ? file.name : current?.alt || 'Current file'}</p>
              <p className="text-xs text-stone-500">{file ? `${fileSize(file.size)} · ${pendingText}` : current?.bytes ? fileSize(current.bytes) : 'Uploaded'}</p>
              {!file && kind === 'pdf' && current?.secureUrl ? <a href={mediaSrc(current.secureUrl)} target="_blank" rel="noreferrer noopener" className="text-xs font-medium text-emerald-800 underline">Open PDF</a> : null}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>Replace</Button>
              <Button variant="ghost" size="sm" aria-label={`Remove ${label}`} onClick={() => { if (file) onFile(null); else onRemoved?.(true); }}><Trash2 className="size-4" aria-hidden="true" /></Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <Icon className="size-8 text-stone-400" aria-hidden="true" />
            <p className="text-sm text-stone-600">{removed ? 'Will be removed when you save.' : 'Drag a file here, or'}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}><Upload className="size-4" aria-hidden="true" /> Choose from device</Button>
              {removed ? <Button variant="ghost" size="sm" onClick={() => onRemoved?.(false)}>Undo</Button> : null}
            </div>
          </div>
        )}
        <input ref={inputRef} id={id} type="file" accept={cfg.accept} className="sr-only" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
    </Field>
  );
}
