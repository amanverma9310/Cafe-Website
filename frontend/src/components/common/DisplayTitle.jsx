import { cn } from '../../utils/cn.js';

/** "Line one\nLine two" -> upright + italic. Without a newline, splits after the first comma/full stop when both halves are meaningful. */
export function splitTitle(title = '') {
  const t = title.trim();
  if (t.includes('\n')) {
    const [first, ...rest] = t.split('\n');
    return [first.trim(), rest.join(' ').trim()];
  }
  const m = t.match(/^(\S+(?:\s+\S+)+?[,.:;])\s+(\S+(?:\s+\S+)+.*)$/);
  return m ? [m[1], m[2]] : [t, ''];
}

export default function DisplayTitle({ title, as: Tag = 'h2', className, split = true }) {
  const [first, rest] = split ? splitTitle(title) : [title, ''];
  return (
    <Tag className={cn('display', className)}>
      <span className="block">{first}</span>
      {rest ? <em className="block">{rest}</em> : null}
    </Tag>
  );
}
