// Runs before `vite build`: writes public/robots.txt and public/sitemap.xml using VITE_SITE_URL.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(root, '.env');
const fromFile = fs.existsSync(envFile) ? /^VITE_SITE_URL=(.*)$/m.exec(fs.readFileSync(envFile, 'utf8'))?.[1]?.trim() : '';
const site = (process.env.VITE_SITE_URL || fromFile || 'http://localhost:5173').replace(/\/$/, '');

const pages = [['/', '1.0'], ['/about', '0.7'], ['/menu', '0.9'], ['/dietary-menu', '0.8'], ['/gallery', '0.6'], ['/contact', '0.8']];
const today = new Date().toISOString().slice(0, 10);
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
  .map(([p, prio]) => `  <url><loc>${site}${p === '/' ? '' : p}</loc><lastmod>${today}</lastmod><priority>${prio}</priority></url>`)
  .join('\n')}\n</urlset>\n`;

fs.mkdirSync(path.join(root, 'public'), { recursive: true });
fs.writeFileSync(path.join(root, 'public/sitemap.xml'), xml);
fs.writeFileSync(path.join(root, 'public/robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${site}/sitemap.xml\n`);
console.log(`SEO files written for ${site}`);
