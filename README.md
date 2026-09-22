# Agama Cafe & Bar — MERN website

The Agama Cafe & Bar site rebuilt as a MongoDB / Express / React / Node app with a full admin dashboard.
Every image, PDF and video is **uploaded from the admin's device to Cloudinary** — there is no "paste a URL" field anywhere.

```
agama-cafe-mern/
├─ backend/    Express 5 + Mongoose API (JWT in HttpOnly cookie, Cloudinary uploads, zod validation)
│  ├─ src/{config,controllers,middleware,models,routes,services,utils,validators}
│  ├─ scripts/seed.js         migrates the original site's data + first admin
│  ├─ seed-assets/            the original photos, PDFs and logo (used only by the seed)
│  └─ tests/                  37 integration/unit tests
└─ frontend/   React 19 + Vite + Tailwind 4 + Framer Motion + React Router (public site + /admin)
   └─ src/__tests__/          27 integration tests (real UI ↔ real API)
```

## Design
A refreshed, dark "botanical editorial" look (deep green, parchment, marigold accent; Fraunces + Hanken Grotesk, self-hosted):
large upright/italic headlines, a scroll-driven full-screen dish showcase, and a portrait **video reel** section.
Structure, pages and content match the original site: Home, About, Menu (with gluten-free / onion-garlic-free / bar tabs), Dietary Menu, Gallery, Contact.

## Run locally
Requirements: Node 20.6+, a MongoDB (local or Atlas). No Cloudinary account is needed to preview.

```bash
# 1. API
cd backend
cp .env.example .env        # set MONGO_URI, JWT_SECRET, ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD
npm install
npm run seed:local          # seeds content; serves the bundled photos from the API (preview only)
npm run dev                 # http://localhost:5000

# 2. Website + admin
cd ../frontend
cp .env.example .env        # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                 # http://localhost:5173   admin: /admin
```
Sign in at `/admin/login` with the ADMIN_* values from `backend/.env`. **Choose a strong password**, and change it under *My profile*.

## Production setup (Vercel + Render + Atlas + Cloudinary)
1. **MongoDB Atlas** — create a free cluster, a database user, and allow Render's IPs (or `0.0.0.0/0`). Copy the connection string.
2. **Cloudinary** — Dashboard → API Keys: cloud name, API key, API secret.
3. **Render (API)** — New → Blueprint (uses `render.yaml`) or a Web Service with root `backend`, build `npm ci --omit=dev`, start `npm start`. Set:
   `MONGO_URI`, `JWT_SECRET` (48+ random chars), `CLIENT_URL` (your Vercel URL, comma-separate several), `CLOUDINARY_*`.
4. **Seed once** (Render shell or your machine with production env vars): `npm run seed` — uploads the bundled assets to Cloudinary and creates the admin from `ADMIN_*`.
   It is safe to re-run: existing content is never overwritten (`npm run seed:reset` wipes and re-creates).
5. **Vercel (site)** — import the repo, root `frontend`, framework Vite. Set `VITE_API_URL=https://<your-api>/api` and `VITE_SITE_URL=https://<your-site>`. `vercel.json` handles SPA routing; `robots.txt` and `sitemap.xml` are generated at build.

**Cookies across domains.** The admin session is an HttpOnly cookie. If the site and API are on different registrable domains
(`x.vercel.app` + `y.onrender.com`) production defaults to `SameSite=None; Secure`, which works in Chrome/Firefox/Edge but **Safari and some
privacy settings block third-party cookies**. For a reliable admin login everywhere, put both on one domain (e.g. `www.example.com` and `api.example.com`)
and set `COOKIE_SAMESITE=lax`, `COOKIE_DOMAIN=.example.com` on the API.

## Using video
* **Home → Sections → Video reel** — upload a portrait (9:16) MP4/MOV/WEBM (≤ 60 MB, `MAX_VIDEO_MB`), then switch the section on. It stays hidden until a video exists.
  It autoplays muted while on screen, pauses when scrolled away, has play/sound controls, and never autoplays for visitors who prefer reduced motion.
* **Dish clips (the "reel" look for your food)** — Home → Sections → *Popular dishes (scroll showcase)* → **Add clip** under any dish.
  While that dish is on screen its clip plays silently on a loop; the photo is the poster and the fallback (also used for visitors who prefer reduced motion).
  Tick *"filmed on a black background"* to blend the clip straight into the page with no frame — this is how the dark, floating-ingredient look is achieved.
* **Home → Top banner & video** — an optional background video for the hero (the photo shows while it loads).
* Only upload footage you own or have permission to use. Short, compressed clips (under ~20 MB) load fastest.

## What the admin can manage
Dashboard · Home sections (text, buttons, photos, order, on/off, video) · Page banners & About · Menu items · Categories (reassign-or-block delete) ·
Dietary menus & PDFs · Gallery · Reviews · Business information · Opening hours · Contact enquiries (read/resolved/search/delete) · Site settings (SEO, logo, favicon, social image) · Profile & password.

## Security notes
Helmet · CORS allow-list (never `*`) · HttpOnly + SameSite cookies · CSRF guard (custom header required on writes) · rate limits on login and enquiries ·
NoSQL-operator stripping · zod validation on every write · bcrypt (cost 12) · uploads verified by **magic bytes**, not the declared type, with per-type size limits ·
password change signs out all other sessions · contact-form honeypot · errors never leak stack traces.

## Tests
```bash
cd backend && npm test                      # needs MongoDB on 127.0.0.1:27017 (uses database "agama_test")
# frontend tests drive the real UI against a running API on a seeded DB:
cd backend && npm run seed:local && NODE_ENV=test PORT=5055 npm start &      # NODE_ENV=test relaxes the login rate limit
cd frontend && echo "VITE_API_URL=http://localhost:5055/api" > .env && npm test
```
Cloudinary is stubbed in the backend tests; the frontend tests do not upload media.

## Filming dish clips that look premium
The site can't make footage look good — the footage does. The dark "ingredients flying" clips you admire are shot like this:
1. **Backdrop:** a matte black cloth or board (black card works); nothing else in frame. Turn off the room lights.
2. **Light:** one bright window or lamp from the **side or back** (not from the phone), so steam, sauce and crumbs catch the light.
3. **Camera:** phone on a tripod or propped against something, **filmed at 60 fps** (1080p), locked focus and exposure (long-press on the dish).
4. **Action (3–8 seconds):** drizzle sauce, sprinkle herbs, tear bread, lift a fork of pasta, pour a shake. Do it 3–4 times and keep the best take.
5. **Export:** square (1:1) or 4:3, no audio needed, under ~15 MB (the limit is 60 MB). Trim to the best 4–6 seconds.
Only film and upload your own dishes; don't use AI-generated food footage that doesn't match what guests are served.
