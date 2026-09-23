# Website visitor tracking — files to add/change

Unzip this on top of your existing `agama-cafe-mern` folder, letting it overwrite/merge.
All paths below are relative to the `agama-cafe-mern/` project root.

## New files
- `backend/src/models/Visit.js` — stores one record per public page view (path + anonymous visitor fingerprint, no raw IP stored).
- `backend/src/controllers/visit.controller.js` — public endpoint that records a visit.
- `backend/src/routes/visit.routes.js` — `POST /api/visits` (public, rate-limited).
- `frontend/src/hooks/useVisitTracker.js` — pings `/api/visits` once per page view on the public site.

## Changed files
- `backend/src/routes/index.js` — mounts the new `/visits` router.
- `backend/src/middleware/rateLimit.middleware.js` — adds `visitLimiter` for the tracking endpoint.
- `backend/src/controllers/dashboard.controller.js` — `GET /api/dashboard` now also returns a `visits` object: `{ total, today, uniqueVisitors, last7Days }`.
- `frontend/src/services/index.js` — adds `visitApi.record(path)`.
- `frontend/src/layouts/MainLayout.jsx` — calls `useVisitTracker()` so every public page view is recorded.
- `frontend/src/pages/admin/Dashboard.jsx` — adds a "Website traffic" card (today / all-time / unique visitors in the last 30 days, plus a 7‑day mini bar chart), no new npm packages required.

## Why it works this way
- Visits are tracked from `MainLayout.jsx`, which only wraps the **public** site routes — admin panel usage is never counted as a "visit".
- "Unique visitors" is computed server-side from a SHA-256 hash of IP + User-Agent (`hashVisitor` in `Visit.js`), so no raw IP addresses are ever stored.
- No new database, frontend, or backend dependency is required — the trend chart is a small inline SVG/CSS bar chart.

## No install step needed
No `npm install` is required — everything uses packages already in your `package.json` (Express, Mongoose, React Router, lucide-react).

Just drop the files in, restart the backend, rebuild/redeploy the frontend, and the "Website traffic" card will appear on the admin dashboard (it starts at 0 and fills in as visitors arrive).
