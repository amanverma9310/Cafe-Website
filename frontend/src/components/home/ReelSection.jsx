import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import CtaLink from '../common/CtaLink.jsx';
import Reveal from '../common/Reveal.jsx';
import SectionHeading from '../common/SectionHeading.jsx';
import SiteContainer from '../common/SiteContainer.jsx';
import { mediaSrc, videoPoster } from '../../utils/media.js';

/** Portrait (9:16) video reel managed from the admin panel. Renders only when a video has been uploaded. */
export default function ReelSection({ section }) {
  const src = section.video?.secureUrl;
  const reduce = useReducedMotion();
  const box = useRef(null);
  const vid = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  // Play while on screen, pause when scrolled away (saves battery/data). Never autoplays with reduced motion.
  useEffect(() => {
    const v = vid.current;
    if (!src || !v || reduce || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().then(() => setPlaying(true)).catch(() => {});
      else { v.pause(); setPlaying(false); }
    }, { threshold: 0.5 });
    io.observe(box.current);
    return () => io.disconnect();
  }, [src, reduce]);

  if (!src) return null;
  const toggle = () => { const v = vid.current; if (v.paused) v.play().then(() => setPlaying(true)); else { v.pause(); setPlaying(false); } };
  const mute = () => { vid.current.muted = !vid.current.muted; setMuted(vid.current.muted); };

  return (
    <section className="border-y border-line bg-surface py-24 sm:py-32">
      <SiteContainer className="grid items-center gap-14 md:grid-cols-[1fr_auto] lg:gap-24">
        <Reveal>
          <SectionHeading eyebrow={section.eyebrow} title={section.title} copy={section.copy} />
          <div className="mt-8 flex flex-wrap gap-3">{(section.ctas || []).map((c, i) => <CtaLink key={i} cta={c} />)}</div>
        </Reveal>
        <Reveal delay={0.1} className="mx-auto">
          <div ref={box} className="relative aspect-[9/16] w-[min(78vw,340px)] overflow-hidden rounded-[2rem] bg-raised shadow-[0_50px_100px_-40px_rgba(0,0,0,.9)] ring-1 ring-fg/15">
            <video
              ref={vid} src={mediaSrc(src)} poster={videoPoster(src) || undefined}
              className="size-full object-cover" loop muted playsInline preload="metadata"
              aria-label={section.video?.alt || section.title}
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent p-4">
              <button type="button" onClick={toggle} aria-label={playing ? 'Pause video' : 'Play video'} className="grid size-11 place-items-center rounded-full bg-paper/90 text-paper-ink hover:bg-paper">
                {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
              </button>
              <button type="button" onClick={mute} aria-label={muted ? 'Turn sound on' : 'Turn sound off'} className="grid size-11 place-items-center rounded-full border border-paper-ink/40 bg-black/30 text-paper-ink backdrop-blur hover:bg-black/50">
                {muted ? <VolumeX className="size-4" aria-hidden="true" /> : <Volume2 className="size-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </Reveal>
      </SiteContainer>
    </section>
  );
}
