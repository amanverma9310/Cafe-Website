import { useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Field, IconButton, inputCls } from './kit.jsx';

/** Edits an array of call-to-action buttons: { label, linkType, href, variant }. */
export default function CtaEditor({ control, register, name = 'ctas', errors, max = 4 }) {
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-medium text-stone-800">Buttons</legend>
      {fields.length === 0 ? <p className="text-sm text-stone-500">No buttons.</p> : null}
      {fields.map((f, i) => (
        <div key={f.id} className="grid gap-3 rounded-lg border border-stone-200 p-3 sm:grid-cols-[1fr_9rem_1fr_8rem_auto]">
          <Field label="Label" htmlFor={`${name}-${i}-l`} error={errors?.[name]?.[i]?.label?.message}><input id={`${name}-${i}-l`} className={inputCls} {...register(`${name}.${i}.label`, { required: 'Add a label' })} /></Field>
          <Field label="Goes to" htmlFor={`${name}-${i}-t`}>
            <select id={`${name}-${i}-t`} className={inputCls} {...register(`${name}.${i}.linkType`)}>
              <option value="internal">Page on this site</option><option value="maps">Directions (map)</option><option value="phone">Call the cafe</option><option value="external">Other website</option>
            </select>
          </Field>
          <Field label="Link" htmlFor={`${name}-${i}-h`} hint="e.g. /menu or /contact#enquiry. Not needed for map or call.">
            <input id={`${name}-${i}-h`} className={inputCls} placeholder="/menu" {...register(`${name}.${i}.href`)} />
          </Field>
          <Field label="Style" htmlFor={`${name}-${i}-v`}>
            <select id={`${name}-${i}-v`} className={inputCls} {...register(`${name}.${i}.variant`)}><option value="primary">Filled</option><option value="secondary">Outlined</option><option value="link">Text link</option></select>
          </Field>
          <div className="flex items-end"><IconButton label={`Remove button ${i + 1}`} onClick={() => remove(i)}><Trash2 className="size-4" aria-hidden="true" /></IconButton></div>
        </div>
      ))}
      {fields.length < max ? <Button variant="secondary" size="sm" onClick={() => append({ label: '', linkType: 'internal', href: '', variant: 'primary' })}><Plus className="size-4" aria-hidden="true" /> Add button</Button> : null}
    </fieldset>
  );
}
