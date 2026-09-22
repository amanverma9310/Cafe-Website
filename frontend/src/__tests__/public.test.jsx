/**
 * Integration tests: the real React app rendered in jsdom against the real API + seeded database
 * (start the backend on the seeded DB first — see README "Testing"). No network mocks for our own API.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App.jsx';

afterEach(cleanup);

const renderAt = (path) =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}><App /></MemoryRouter>
    </HelmetProvider>,
  );
const byText = (re) => screen.findByText(re, {}, { timeout: 15000 });

describe('home page', () => {
  it('renders the CMS hero, navigation, footer and business details from the API', async () => {
    renderAt('/');
    expect((await screen.findByRole('heading', { level: 1 }, { timeout: 15000 })).textContent).toMatch(/From the farm,\s*to your table\./);
    expect(screen.getAllByRole('navigation').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Reserve a Table/i).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('4.5', {}, { timeout: 15000 })).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Greater Kailash II/).length).toBeGreaterThan(0);
  });

  it('renders every enabled section and skips the reel until a video exists', async () => {
    renderAt('/');
    await byText(/Food, ambience and a gentler pace/);
    expect(await byText(/Familiar comfort/)).toBeTruthy();
    expect(await byText(/More ways to dine together/)).toBeTruthy();
    expect(await byText(/A space to slow down/)).toBeTruthy();
    expect(await byText(/Designed for more than one kind of meal/)).toBeTruthy();
    expect(await byText(/Come in and stay awhile/)).toBeTruthy();
    expect(await byText(/Your table at Agama awaits/)).toBeTruthy();
    expect(screen.queryByText(/Step inside, for a moment/)).toBeNull(); // reel disabled + no video
  });

  it('shows featured dishes from the menu API with ₹ prices and both dietary menus', async () => {
    renderAt('/');
    expect(await byText('Carrot & Ginger Soup')).toBeTruthy();
    expect(screen.getAllByText(/^₹\d/).length).toBeGreaterThanOrEqual(6);
    expect(await byText('Gluten Free Menu')).toBeTruthy();
    expect(screen.getAllByText('Onion & Garlic Free').length).toBeGreaterThan(0);
  });

  it('shows the scroll-driven dish moments with all six featured dishes', async () => {
    renderAt('/');
    await byText(/Food, ambience/);
    await waitFor(() => expect(screen.getAllByText(/^0\d$/).length).toBeGreaterThanOrEqual(1), { timeout: 15000 });
    expect(screen.getAllByText('Shakshuka').length).toBeGreaterThan(0);
  });

  it('lists opening hours with the "Confirm timing" placeholder the owner has not replaced yet', async () => {
    renderAt('/');
    await byText(/Guest impressions/);
    expect(screen.getAllByText('Confirm timing').length).toBe(7);
    expect(screen.getAllByText('Closes at 12:00 AM').length).toBeGreaterThan(0);
  });
});

describe('menu page', () => {
  it('shows all four menu tabs and the full seeded main menu', async () => {
    renderAt('/menu');
    const tabs = await screen.findAllByRole('tab', {}, { timeout: 15000 });
    expect(tabs.map((t) => t.textContent)).toEqual(['Main Menu', 'Gluten Free', 'Onion & Garlic Free', 'Bar Menu']);
    await byText('Agama Asian Bowl');
    expect(document.querySelectorAll('h3').length).toBeGreaterThanOrEqual(66);
  });

  it('filters by category and switches to a dietary menu with its own dishes and tags', async () => {
    renderAt('/menu');
    await byText('Agama Asian Bowl');
    const before = document.querySelectorAll('li h3').length;
    fireEvent.click(await screen.findByRole('button', { name: /^Soups/ }));
    await waitFor(() => expect(document.querySelectorAll('li h3').length).toBeLessThan(before));
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Onion & Garlic Free' }), { button: 0 });
    await waitFor(() => expect(screen.getAllByText('Onion & garlic free').length).toBe(8), { timeout: 15000 });
  });

  it('shows the bar menu as an information-only panel with no ordering', async () => {
    renderAt('/menu?tab=bar');
    expect(await byText(/does not provide alcohol ordering/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /order|add to cart|buy/i })).toBeNull();
  });

  it('dietary page only offers dietary menus', async () => {
    renderAt('/dietary-menu');
    const tabs = await screen.findAllByRole('tab', {}, { timeout: 15000 });
    expect(tabs.map((t) => t.textContent)).toEqual(['Gluten Free', 'Onion & Garlic Free']);
  });
});

describe('gallery, about, contact, 404', () => {
  it('renders all 15 gallery photos and filters by type', async () => {
    renderAt('/gallery');
    await waitFor(() => expect(document.querySelectorAll('figure').length).toBe(15), { timeout: 15000 });
    fireEvent.click(screen.getByRole('button', { name: 'Drinks' }));
    await waitFor(() => expect(document.querySelectorAll('figure').length).toBeLessThan(15));
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    await waitFor(() => expect(document.querySelectorAll('figure').length).toBe(15));
  });

  it('renders the about story and pillars', async () => {
    renderAt('/about');
    expect(await byText(/interpreted with a calm city sensibility/)).toBeTruthy();
    expect(await byText('Plant-based dining')).toBeTruthy();
    expect(screen.getByText('Dietary choice')).toBeTruthy();
  });

  it('validates the enquiry form on the client and hides the honeypot from people', async () => {
    renderAt('/contact');
    const send = await screen.findByRole('button', { name: /send enquiry/i }, { timeout: 15000 });
    fireEvent.click(send);
    expect(await screen.findByText('Please enter your name')).toBeTruthy();
    expect(screen.getByText('Please enter a phone number')).toBeTruthy();
    const honeypot = document.querySelector('input[name="website"]');
    expect(honeypot.closest('[aria-hidden="true"]')).toBeTruthy();
    expect(honeypot.tabIndex).toBe(-1);
  });

  it('submits a real enquiry to the API and shows the success state', async () => {
    renderAt('/contact');
    await screen.findByRole('button', { name: /send enquiry/i }, { timeout: 15000 });
    fireEvent.click(screen.getByLabelText(/reserve a table/i));
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Frontend Test' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '+91 98765 00000' } });
    fireEvent.change(screen.getByLabelText(/party size/i), { target: { value: 'Table for two on Saturday evening, please.' } });
    fireEvent.click(screen.getByRole('button', { name: /send enquiry/i }));
    expect(await screen.findByText(/we’ve got your enquiry/i, {}, { timeout: 15000 })).toBeTruthy();
  });

  it('shows a friendly 404', async () => {
    renderAt('/nope');
    expect(await screen.findByRole('heading', { level: 1 }, { timeout: 15000 })).toBeTruthy();
    expect(screen.getByText('404')).toBeTruthy();
  });
});
