import { useState } from 'react';
import { cn } from '../../utils/cn.js';
import { mediaSrc, optimized, srcSet } from '../../utils/media.js';

/**
 * Responsive image for CMS media. Cloudinary URLs get automatic format/quality and a srcset;
 * `fill` makes it cover its (relatively positioned) parent. Falls back to a plain tile if the file fails to load.
 */
export default function Img({ src, alt = '', fill = false, priority = false, sizes = '100vw', className, ...rest }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div role={alt ? 'img' : undefined} aria-label={alt || undefined} className={cn('bg-raised', fill && 'absolute inset-0', className)} />;
  return (
    <img
      src={optimized(src, 1200) || mediaSrc(src)}
      srcSet={srcSet(src)}
      sizes={srcSet(src) ? sizes : undefined}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn(fill && 'absolute inset-0 size-full', 'object-cover', className)}
      {...rest}
    />
  );
}
