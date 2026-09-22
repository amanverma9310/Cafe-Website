import { cleanup, render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { SiteProvider } from '../context/SiteContext.jsx';
import DishMoments from '../components/home/DishMoments.jsx';

afterEach(cleanup);
const img = (i, extra = {}) => ({ id: `d${i}`, secureUrl: `https://res.cloudinary.com/demo/image/upload/v1/dish${i}.jpg`, alt: `Dish ${i}`, caption: `Vegan Dish ${i}`, ...extra });
const clip = (i) => ({ secureUrl: `https://res.cloudinary.com/demo/video/upload/v1/dish${i}.mp4`, alt: `Dish ${i} clip` });
const show = (images) => render(
  <HelmetProvider><MemoryRouter><SiteProvider><DishMoments section={{ key: 'featuredDishes', title: 'A table full of colour.', eyebrow: 'Popular picks', images, ctas: [] }} /></SiteProvider></MemoryRouter></HelmetProvider>,
);

describe('dish clips in the scroll showcase', () => {
  it('renders a muted, looping, inline clip only for dishes that have one, with the photo as poster', () => {
    const { container } = show([img(1, { video: clip(1) }), img(2), img(3, { video: clip(3), blend: true })]);
    const videos = [...container.querySelectorAll('video')];
    expect(videos.length).toBe(2);
    for (const v of videos) {
      expect(v.muted).toBe(true);
      expect(v.loop).toBe(true);
      expect(v.hasAttribute('playsinline')).toBe(true);
      expect(v.getAttribute('poster')).toMatch(/f_auto,q_auto/); // photo shown until the clip is ready
    }
    expect(videos[1].className).toMatch(/mix-blend-lighten/); // shot-on-black clips blend into the page
    expect(videos[0].className).not.toMatch(/mix-blend-lighten/);
  });

  it('keeps showing photos when no dish has a clip', () => {
    const { container } = show([img(1), img(2)]);
    expect(container.querySelectorAll('video').length).toBe(0);
    expect(container.querySelectorAll('img').length).toBe(2);
  });
});
