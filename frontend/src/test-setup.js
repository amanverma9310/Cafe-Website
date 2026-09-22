import { vi } from 'vitest';
Object.defineProperty(window, 'matchMedia', { writable: true, value: (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; } }) });
window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
window.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();
window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
window.HTMLElement.prototype.hasPointerCapture = () => false;
window.HTMLElement.prototype.releasePointerCapture = () => {};
// jsdom does not implement media playback
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};
