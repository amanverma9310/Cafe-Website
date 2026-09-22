import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';

import CtaLink from '../common/CtaLink.jsx';
import Img from '../common/Img.jsx';
import SectionHeading from '../common/SectionHeading.jsx';
import SiteContainer from '../common/SiteContainer.jsx';
import { cn } from '../../utils/cn.js';
import {
  mediaSrc,
  optimized,
} from '../../utils/media.js';

const splitName = (name = '') => {
  const words = name.trim().split(/\s+/);

  if (words.length <= 1) {
    return [name, ''];
  }

  return [
    words.slice(0, -1).join(' '),
    words[words.length - 1],
  ];
};

function DishClip({ dish }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return undefined;

    video.play().catch(() => {});

    return () => {
      video.pause();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={mediaSrc(
        dish.video.secureUrl
      )}
      poster={
        optimized(
          dish.secureUrl,
          900
        ) || undefined
      }
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={
        dish.video.alt || dish.alt
      }
      className={cn(
        'absolute inset-0 h-full w-full',
        dish.blend
          ? 'object-contain mix-blend-lighten'
          : 'object-cover'
      )}
    />
  );
}

function DishLayer({
  dish,
  index,
  total,
  progress,
}) {
  const start = index / total;
  const end = (index + 1) / total;
  const middle = (start + end) / 2;

  /*
   * Restored original scroll-controlled
   * text movement.
   */
  const contentY = useTransform(
    progress,
    [start, middle, end],
    [70, 0, -70],
    {
      clamp: true,
    }
  );

  /*
   * Restored original image coming-out motion.
   */
  const imageScale = useTransform(
    progress,
    [start, middle, end],
    [0.9, 1, 1.07],
    {
      clamp: true,
    }
  );

  /*
   * Restored original image rotation.
   */
  const imageRotation = useTransform(
    progress,
    [start, middle, end],
    [
      index % 2 ? 5 : -5,
      0,
      index % 2 ? -3 : 3,
    ],
    {
      clamp: true,
    }
  );

  const [lead, tail] = splitName(
    dish.caption || dish.alt
  );

  const hasVideo = Boolean(
    dish.video?.secureUrl
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.2,
        ease: 'easeOut',
      }}
      className="absolute inset-0 z-[2] flex items-center"
    >
      <SiteContainer className="grid items-center gap-8 md:grid-cols-[1fr_1fr] md:gap-16">
        <motion.div
          style={{
            y: contentY,
          }}
          className="order-2 md:order-1"
        >
          <p className="mb-4 font-display text-xl tabular-nums text-accent">
            {String(index + 1).padStart(
              2,
              '0'
            )}

            <span className="text-fg/40">
              {' '}
              /{' '}
              {String(total).padStart(
                2,
                '0'
              )}
            </span>
          </p>

          <h3 className="display text-[clamp(2.8rem,8vw,7rem)] leading-[0.92]">
            <span className="block">
              {lead}
            </span>

            {tail ? (
              <em className="block">
                {tail}
              </em>
            ) : null}
          </h3>
        </motion.div>

        <motion.div
          style={{
            scale: imageScale,
            rotate: imageRotation,
          }}
          className="order-1 mx-auto w-full max-w-[280px] sm:max-w-[400px] md:order-2 md:max-w-[460px]"
        >
          <div
            className={cn(
              'relative aspect-[4/3]',
              !(
                hasVideo &&
                dish.blend
              ) &&
                'overflow-hidden rounded-[2rem] shadow-[0_40px_90px_-30px_rgba(0,0,0,.8)] ring-1 ring-fg/15'
            )}
          >
            {!hasVideo ||
            !dish.blend ? (
              <Img
                src={dish.secureUrl}
                alt={dish.alt}
                fill
                sizes="460px"
                priority={index === 0}
              />
            ) : null}

            {hasVideo ? (
              <DishClip dish={dish} />
            ) : null}
          </div>
        </motion.div>
      </SiteContainer>
    </motion.div>
  );
}

function StaticGrid({ dishes }) {
  return (
    <ul className="mt-14 grid grid-cols-2 gap-5 md:grid-cols-3">
      {dishes.map((dish) => (
        <li key={dish.id}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Img
              src={dish.secureUrl}
              alt={dish.alt}
              fill
              sizes="(min-width:768px) 30vw, 45vw"
            />
          </div>

          <p className="mt-3 font-display text-xl">
            {dish.caption}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function DishMoments({
  section,
}) {
  const dishes = (
    section.images || []
  ).filter((dish) => dish.secureUrl);

  const sectionRef = useRef(null);
  const shouldReduceMotion =
    useReducedMotion();

  const [activeIndex, setActiveIndex] =
    useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: [
      'start start',
      'end end',
    ],
  });

  useMotionValueEvent(
    scrollYProgress,
    'change',
    (value) => {
      if (!dishes.length) return;

      const calculatedIndex =
        Math.floor(
          value * dishes.length
        );

      const nextIndex = Math.max(
        0,
        Math.min(
          calculatedIndex,
          dishes.length - 1
        )
      );

      setActiveIndex(
        (currentIndex) => {
          if (
            currentIndex === nextIndex
          ) {
            return currentIndex;
          }

          return nextIndex;
        }
      );
    }
  );

  if (!dishes.length) {
    return null;
  }

  if (
    shouldReduceMotion ||
    dishes.length < 2
  ) {
    return (
      <section className="py-24 sm:py-32">
        <SiteContainer>
          <SectionHeading
            eyebrow={section.eyebrow}
            title={section.title}
            copy={section.copy}
          />

          <StaticGrid
            dishes={dishes}
          />
        </SiteContainer>
      </section>
    );
  }

  const safeActiveIndex = Math.min(
    activeIndex,
    dishes.length - 1
  );

  const activeDish =
    dishes[safeActiveIndex];

  return (
    <section
      ref={sectionRef}
      style={{
        height: `${
          dishes.length * 85 + 30
        }svh`,
      }}
      className="relative"
      aria-label={section.title}
    >
      <div className="grain sticky top-0 h-svh overflow-hidden bg-[radial-gradient(ellipse_at_70%_50%,rgba(232,169,61,.12),transparent_60%)]">
        <div className="absolute inset-x-0 top-0 z-10 pt-24 sm:pt-28">
          <SiteContainer className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-md">
              {section.eyebrow ? (
                <p className="text-sm font-medium text-accent">
                  {section.eyebrow}
                </p>
              ) : null}

              <p className="mt-1 font-display text-2xl leading-tight text-fg/85">
                {section.title}
              </p>
            </div>

            <div className="hidden sm:block">
              {(section.ctas || []).map(
                (cta, index) => (
                  <CtaLink
                    key={
                      cta.id ||
                      `cta-${index}`
                    }
                    cta={cta}
                  />
                )
              )}
            </div>
          </SiteContainer>
        </div>

        <DishLayer
          key={
            activeDish.id ||
            safeActiveIndex
          }
          dish={activeDish}
          index={safeActiveIndex}
          total={dishes.length}
          progress={scrollYProgress}
        />

        <div className="absolute inset-x-0 bottom-8 z-10">
          <SiteContainer>
            <div className="h-px w-full overflow-hidden bg-fg/15">
              <motion.div
                style={{
                  scaleX:
                    scrollYProgress,
                }}
                className="h-px origin-left bg-accent"
              />
            </div>
          </SiteContainer>
        </div>
      </div>
    </section>
  );
}