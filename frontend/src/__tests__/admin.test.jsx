/**
 * Admin dashboard integration tests: real UI, real login cookie, real API + database.
 * Media uploads are not exercised end-to-end here because the sandbox has no Cloudinary account
 * (the backend suite covers uploads with a stubbed Cloudinary client).
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App.jsx';
import { contentApi, siteApi, authApi, enquiryApi } from '../services/index.js';

afterEach(cleanup);
const T = { timeout: 15000 };
const renderAt = (path) =>
  render(<HelmetProvider><MemoryRouter initialEntries={[path]}><App /><Toaster /></MemoryRouter></HelmetProvider>);
const type = (el, value) => fireEvent.change(el, { target: { value } });
const addDishBtn = async () => {
  const btn = await screen.findByRole('button', { name: /Add dish/ }, T);
  await waitFor(() => expect(btn.disabled).toBe(false), T); // enabled once categories & menus have loaded
  return btn;
};
const signIn = async () => {
  renderAt('/admin/dashboard');
  fireEvent.change(await screen.findByLabelText('Email', {}, T), { target: { value: 'owner@agama.test' } });
  type(screen.getByLabelText('Password'), 'Agama-Admin-2026');
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  await screen.findByText(/Welcome back/, {}, T);
};

describe('admin auth', () => {
  it('sends signed-out visitors to the login screen and rejects a wrong password', async () => {
    renderAt('/admin/menu');
    fireEvent.change(await screen.findByLabelText('Email', {}, T), { target: { value: 'owner@agama.test' } });
    type(screen.getByLabelText('Password'), 'definitely-wrong-1');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Incorrect email or password.', {}, T)).toBeTruthy();
    expect(screen.queryByText(/Welcome back/)).toBeNull();
  });

  it('validates the login form before calling the API', async () => {
    cleanup(); renderAt('/admin/login');
    fireEvent.click(await screen.findByRole('button', { name: 'Sign in' }, T));
    expect(await screen.findByText('Enter your email')).toBeTruthy();
    expect(screen.getByText('Enter your password')).toBeTruthy();
  });

  it('signs in and shows real counts on the dashboard', async () => {
    cleanup(); await signIn();
    expect(screen.getByText('Menu items')).toBeTruthy();
    expect(await screen.findByText('84', {}, T)).toBeTruthy(); // 66 + 10 + 8 seeded dishes
    expect(screen.getByText('Recent enquiries')).toBeTruthy();
  });
});

describe('admin menu items', () => {
  it('lists seeded dishes, searches, adds, toggles availability and deletes a dish', async () => {
    cleanup(); renderAt('/admin/menu');
    expect((await screen.findAllByText('Carrot & Ginger Soup', {}, T)).length).toBeGreaterThan(0); // appears in the main AND gluten-free menu
    expect(screen.getByText(/Page 1 of/)).toBeTruthy();

    type(screen.getByLabelText('Search dishes…'), 'shakshuka');
    await waitFor(() => expect(screen.queryAllByText('Carrot & Ginger Soup').length).toBe(0), T);
    expect(screen.getAllByText(/Shakshuka/i).length).toBeGreaterThan(0);
    type(screen.getByLabelText('Search dishes…'), '');

    fireEvent.click(await addDishBtn());
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add dish' })); // empty submit
    expect(await within(dialog).findByText('Name is required')).toBeTruthy();
    expect(within(dialog).getByText('Choose a category')).toBeTruthy();

    type(within(dialog).getByLabelText(/^Name/), 'ZZ Admin Test Dish');
    type(within(dialog).getByLabelText(/Price/), '321');
    const cat = within(dialog).getByLabelText(/^Category/);
    type(cat, cat.querySelectorAll('option')[1].value);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add dish' }));
    expect(await screen.findByText('Dish added.', {}, T)).toBeTruthy();

    type(screen.getByLabelText('Search dishes…'), 'ZZ Admin Test');
    const sw = await screen.findByRole('switch', { name: 'ZZ Admin Test Dish available' }, T);
    expect(sw.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(sw);
    await waitFor(() => expect(screen.getByRole('switch', { name: 'ZZ Admin Test Dish available' }).getAttribute('aria-checked')).toBe('false'));

    fireEvent.click(screen.getByRole('button', { name: 'Delete ZZ Admin Test Dish' }));
    fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Dish deleted.', {}, T)).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('ZZ Admin Test Dish')).toBeNull(), T);
  });

  it('rejects a wrong file type in the photo picker before anything is uploaded', async () => {
    cleanup(); renderAt('/admin/menu');
    fireEvent.click(await addDishBtn());
    const dialog = await screen.findByRole('dialog');
    const input = dialog.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [new File(['hello'], 'notes.txt', { type: 'text/plain' })] } });
    expect(await within(dialog).findByText(/isn’t supported/)).toBeTruthy();
    fireEvent.change(input, { target: { files: [new File([new Uint8Array(11 * 1048576)], 'huge.jpg', { type: 'image/jpeg' })] } });
    expect(await within(dialog).findByText(/limit is 10 MB/)).toBeTruthy();
    expect(within(dialog).queryByRole('textbox', { name: /url/i })).toBeNull(); // no manual URL entry for media
  });
});

describe('admin categories', () => {
  it('adds and deletes an empty category, and refuses to delete one that still has dishes', async () => {
    cleanup(); renderAt('/admin/categories');
    expect(await screen.findByText('Soups', {}, T)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Add category/ }));
    type(await screen.findByLabelText(/^Name/), 'ZZ Temp Category');
    fireEvent.click(screen.getByRole('button', { name: 'Add category', hidden: false }));
    expect(await screen.findByText('Category added.', {}, T)).toBeTruthy();

    fireEvent.click(await screen.findByRole('button', { name: 'Delete ZZ Temp Category' }, T));
    fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Category deleted.', {}, T)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Soups' }));
    const dlg = await screen.findByRole('alertdialog');
    expect(within(dlg).getByText(/still has|Move them/i)).toBeTruthy();
    fireEvent.click(within(dlg).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText(/Choose where the dishes should go/, {}, T)).toBeTruthy();
    fireEvent.click(within(dlg).getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('Soups')).toBeTruthy(); // still there
  });
});

describe('admin enquiries, hours, reviews, profile', () => {
  it('shows the enquiry the public form created, marks it resolved and deletes it', async () => {
    await enquiryApi.submit({ name: 'Admin Flow Guest', phone: '+91 98765 00000', enquiryType: 'Reservation', message: 'Table for two on Saturday evening, please.' });
    cleanup(); renderAt('/admin/enquiries');
    const row = await screen.findByRole('button', { name: /Open enquiry from Admin Flow Guest/ }, T);
    fireEvent.click(row);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Saturday evening/)).toBeTruthy();
    expect(within(dialog).getByRole('link', { name: /\+91 98765 00000/ }).getAttribute('href')).toBe('tel:+91 98765 00000');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mark resolved' }));
    expect(await within(dialog).findByRole('button', { name: 'Reopen' }, T)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete enquiry from Admin Flow Guest' }));
    fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Enquiry deleted.', {}, T)).toBeTruthy();
  });

  it('edits opening hours, saves them, and restores the originals', async () => {
    const original = (await siteApi.bootstrap()).hours;
    cleanup(); renderAt('/admin/hours');
    const opens = await screen.findByLabelText(/Opens/i, { selector: '#o-0' }, T);
    type(opens, '09:30');
    type(document.querySelector('#c-0'), '23:30');
    fireEvent.click(screen.getByRole('button', { name: 'Save opening hours' }));
    expect(await screen.findByText('Opening hours saved.', {}, T)).toBeTruthy();
    const saved = (await siteApi.bootstrap()).hours.days[0];
    expect([saved.opensAt, saved.closesAt]).toEqual(['09:30', '23:30']);
    await siteApi.saveHours({ days: original.days, badgeText: original.badgeText, disclaimer: original.disclaimer });
  });

  it('adds and removes a review', async () => {
    cleanup(); renderAt('/admin/reviews');
    fireEvent.click(await screen.findByRole('button', { name: /Add review/ }, T));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add review' }));
    expect(await within(dialog).findByText('Name is required')).toBeTruthy();
    type(within(dialog).getByLabelText(/Reviewer name/), 'Test Guest');
    fireEvent.click(within(dialog).getByRole('radio', { name: '4 stars' }));
    type(within(dialog).getByLabelText(/^Review\s*\*?$/), 'Lovely brunch and calm room.');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add review' }));
    expect(await screen.findByText('Review added.', {}, T)).toBeTruthy();
    fireEvent.click(await screen.findByRole('button', { name: 'Delete review' }, T));
    fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Review deleted.', {}, T)).toBeTruthy();
  });

  it('validates the password form on the client', async () => {
    cleanup(); renderAt('/admin/profile');
    fireEvent.click(await screen.findByRole('button', { name: 'Change password' }, T));
    expect(await screen.findByText('Enter your current password')).toBeTruthy();
    expect(screen.getByText('Enter a new password')).toBeTruthy();
  });
});

describe('admin home page manager (incl. video reel)', () => {
  it('toggling a section keeps its text, and the reel explains it needs a video', async () => {
    const restore = async () => {
      const all = await contentApi.sections();
      for (const [key, enabled] of [['about', true], ['reel', false]]) {
        const s = all.find((x) => x.key === key);
        if (s.enabled !== enabled) await contentApi.saveSection(key, { enabled, eyebrow: s.eyebrow, title: s.title, copy: s.copy, note: s.note, badge: s.badge, tagline: s.tagline, quote: s.quote, quoteNote: s.quoteNote, highlights: s.highlights, items: s.items, ctas: s.ctas });
      }
    };
    await restore();
    try {
    cleanup(); renderAt('/admin/home');
    expect(await screen.findByText('Video reel', {}, T)).toBeTruthy();
    expect(screen.getByText('Popular dishes (scroll showcase)')).toBeTruthy();

    const aboutSwitch = screen.getByRole('switch', { name: 'Show About' });
    fireEvent.click(aboutSwitch);
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Show About' }).getAttribute('aria-checked')).toBe('false'));
    // the switch flips optimistically; wait for the save to land before reading the API
    await waitFor(async () => expect((await contentApi.sections()).find((s) => s.key === 'about').enabled).toBe(false), T);
    const about = (await contentApi.sections()).find((s) => s.key === 'about');
    expect(about.title).toBe('Food, ambience and a gentler pace.'); // text must survive the toggle
    expect(about.highlights.length).toBe(2);
    fireEvent.click(screen.getByRole('switch', { name: 'Show About' }));
    await waitFor(async () => expect((await contentApi.sections()).find((s) => s.key === 'about').enabled).toBe(true));

    fireEvent.click(screen.getByRole('switch', { name: 'Show Video reel' }));
    expect(await screen.findByText('Needs a video to appear', {}, T)).toBeTruthy();
    fireEvent.click(screen.getByRole('switch', { name: 'Show Video reel' }));
    await waitFor(() => expect(screen.queryByText('Needs a video to appear')).toBeNull(), T);
    } finally { await restore(); }
  });

  it('the reel editor accepts only video files from the device and surfaces a friendly upload error', async () => {
    cleanup(); renderAt('/admin/home');
    await screen.findByText('Video reel', {}, T);
    const reelRow = screen.getByText('Video reel').closest('div.flex.flex-wrap');
    fireEvent.click(within(reelRow).getByRole('button', { name: /Edit/ }));
    const dialog = await screen.findByRole('dialog', {}, T);
    expect(within(dialog).getByText(/portrait \(9:16\) video/)).toBeTruthy();
    const input = dialog.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [new File(['x'], 'photo.png', { type: 'image/png' })] } });
    expect(await within(dialog).findByText(/isn’t supported/)).toBeTruthy();

    // A well-formed MP4 header passes client + server checks; with no Cloudinary configured in dev the API says so plainly.
    const jw = globalThis.jsdom.window;
    const realFD = globalThis.FormData;
    globalThis.FormData = jw.FormData; // jsdom's XHR can only serialise jsdom's own FormData/File
    URL.createObjectURL = () => 'blob:test'; URL.revokeObjectURL = () => {};
    const mp4 = new jw.File([new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0, 0, 0])], 'reel.mp4', { type: 'video/mp4' });
    fireEvent.change(input, { target: { files: [mp4] } });
    fireEvent.click(await within(dialog).findByRole('button', { name: 'Upload video' }));
    try {
      expect(await screen.findByText(/Media storage is not configured/, {}, T)).toBeTruthy();
    } finally { globalThis.FormData = realFD; }
  });

  it('offers an "Add clip" per dish, rejects non-videos, and shows the server\'s message when storage is not configured', async () => {
    cleanup(); renderAt('/admin/home');
    const row = (await screen.findByText('Popular dishes (scroll showcase)', {}, T)).closest('div.flex.flex-wrap');
    fireEvent.click(within(row).getByRole('button', { name: /Edit/ }));
    const dialog = await screen.findByRole('dialog', {}, T);
    const inputs = within(dialog).getAllByLabelText(/^Add clip for/);
    expect(inputs.length).toBe(6); // one per featured dish
    expect(within(dialog).getAllByText(/No clip — the photo is shown/).length).toBe(6);

    fireEvent.change(inputs[0], { target: { files: [new File(['x'], 'pic.png', { type: 'image/png' })] } });
    expect(await within(dialog).findByText(/isn’t a video/)).toBeTruthy();

    const jw = globalThis.jsdom.window;
    const realFD = globalThis.FormData;
    globalThis.FormData = jw.FormData; // jsdom's XHR can only serialise jsdom's own FormData/File
    try {
      const mp4 = new jw.File([new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0, 0, 0])], 'shakshuka.mp4', { type: 'video/mp4' });
      fireEvent.change(inputs[0], { target: { files: [mp4] } });
      expect(await screen.findByText(/Media storage is not configured/, {}, T)).toBeTruthy();
    } finally { globalThis.FormData = realFD; }
  });

  it('signs out', async () => {
    cleanup(); renderAt('/admin/dashboard');
    fireEvent.click(await screen.findByRole('button', { name: /Sign out/ }, T));
    expect(await screen.findByRole('button', { name: 'Sign in' }, T)).toBeTruthy();
    expect(await authApi.me().then(() => 'still-authed', () => 'signed-out')).toBe('signed-out');
  });
});
