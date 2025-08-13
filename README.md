# Dev Notes

A modern, visually appealing note-taking app built for developers. Save titles, URLs, code snippets, and tags; search and filter quickly; look up abbreviations; and install it as a desktop-like PWA.

## Tech Stack

- React 19 + TypeScript + Vite
- Express 5 for the API
- SQLite persistence via `sql.js` (a pure JS/WASM SQLite engine)
- PrismJS for code syntax highlighting
- CSS for a dark, modern UI
- PWA (manifest + service worker) for offline and installable experience

## Architecture

- Frontend (Vite + React) lives under `src/` and builds into `dist/`.
- Backend (Express) lives under `server/` and exposes REST endpoints under `/api`.
- Data is persisted to `data/dev-notes.sqlite` on disk using `sql.js`.
- In development, the frontend proxies `/api` to the backend using Vite dev server proxy.
- In production, the Express server can serve the built frontend from `dist/` on the same port.

### API Endpoints

- `GET /api/notes` → list all notes
- `POST /api/notes` → create a note
  - body: `{ title: string; url?: string; code?: string; tags?: string[] }`
- `DELETE /api/notes/:id` → delete a note by id

Each note:
```
{
  id: string,             // generated via Date.now().toString()
  title: string,
  url?: string,
  code?: string,
  tags?: string[]         // stored as JSON in SQLite
}
```

## Getting Started

### Prerequisites
- Node.js (LTS) and npm

### Install dependencies
```bash
npm install
```

### Run in development (separate ports via proxy)
```bash
npm run dev
```
- API: `http://localhost:3001`
- Frontend: `http://localhost:5173`
- Vite proxies `/api/*` to the API, so the frontend can call relative paths like `/api/notes`.

### Build for production
```bash
npm run build
```

### Run in production (single port)
```bash
node server/index.js
```
- The server serves the API under `/api/*` and the built SPA from `dist/` on the same port.
- Default port is `3001` (override with `PORT=<port>`).

### Run as an independent app (desktop window)

- PWA install (recommended):
  - Dev (proxy mode): open `http://localhost:5173` after `npm run dev` and click the Install icon in Chrome/Edge (or use the Apps/Save & share menu → Install).
  - Prod (single port): open `http://localhost:3001` after `node server/index.js` and install the app.
  - After install, launch from the OS:
    - Windows 10/11: Start menu entry (you can pin to Taskbar). The app opens in its own window without browser UI.
  - Uninstall/update: Manage from the browser’s Apps list (Chrome: `chrome://apps` / Edge: `edge://apps`).

- Quick app window without installing (convenience for dev):
  - Chrome (prod single port):
    - `start chrome --app=http://localhost:3001`
  - Edge (prod single port):
    - `start msedge --app=http://localhost:3001`
  - For dev via Vite, replace URL with `http://localhost:5173`.

### Alternative: Split deployment (best for scale)
- Serve `dist/` via a static host/CDN or a reverse proxy (Nginx/IIS), and run the API as a separate service.
- Keep frontend API calls relative (e.g., `/api/notes`) and let the reverse proxy route `/api` to the API service.
- If hosting the API on a different domain, enable CORS in the server (already added) and optionally introduce an environment-based `API_BASE_URL` in the frontend if you won’t use a proxy.

## Features

- Notes with developer-friendly details
  - Title (always visible)
  - Optional URL, Code Snippet, and Tags toggled via checkboxes
  - Syntax highlighting for code using PrismJS
  - Collapsible notes: show only titles by default; click a title to expand
  - Three-dots menu per note with Delete action
- Search
  - Filter notes by title, URL, or code content (Search tab)
- Tags
  - Add tags (comma-separated) when creating notes
  - Filter notes by tag (Tags tab)
- Web Search (Abbreviations)
  - Look up common technical abbreviations in the Web Search tab
  - Uses a local dictionary first, then falls back to Wikipedia summaries
- Persistence
  - Notes are saved to SQLite at `data/dev-notes.sqlite` (no browser storage required)
- PWA + Offline support
  - Installable; works without an internet connection after first load

## Using the App

### Notes
1. Go to the Notes tab.
2. Enter a Title (required).
3. Check the boxes for URL, Code Snippet, and/or Tags to reveal those inputs.
4. Enter optional values:
   - URL: Full link (e.g., https://example.com)
   - Code Snippet: Any code text; highlighted automatically
   - Tags: Comma-separated (e.g., react, hooks, api)
5. Click Add Note.
6. Your notes list shows only titles; click a title to expand/collapse the details.
7. Use the three-dots (⋮) on the top right of a note to reveal the Delete option.

### Search
- Go to the Search tab and type your query. Matches in titles, URLs, or code are shown live.

### Tags
- Go to the Tags tab, click a tag to filter notes. Click again to clear the selection.

### Web Search (Abbreviations)
- Open the Web Search tab, enter an abbreviation (e.g., API, JWT) and search.
- The app first checks a built-in dictionary, then tries Wikipedia for a one-line summary.

## Styling & UX

- Clean sidebar with tabs: Notes, Search, Tags, Web Search
- Compact font sizes for information density
- Dark gradient background with white note text for contrast
- Smooth expand/collapse animations and hover affordances

## Data & Storage

- Notes are stored in SQLite at `data/dev-notes.sqlite`.
- Tags are stored as a JSON array in the `tags` column.
- Previous versions used `localStorage` under key `dev-notes`; this version no longer reads from it.

## Deployment Recommendations

- Small/self-hosted: Run single port as shown above for simplicity.
- Production at scale: Split frontend (static hosting/CDN) and backend (API service). Use a reverse proxy to map `/api` to the service.
- Security hardening (if exposed): add logging, rate limiting, input validation, and backups of `data/dev-notes.sqlite`.

## Troubleshooting

- Express 5 wildcard route:
  - Use `app.get('/*', ...)` for SPA fallback and register it after the API routes. This avoids `path-to-regexp` errors.
- Windows native build issues:
  - We use `sql.js` (WASM) to avoid native build steps required by `better-sqlite3`.
- PWA install icon not visible:
  - Ensure you’re running via `npm run dev`/`npm run preview` (or `node server/index.js` for prod) and open the served URL in Chrome/Edge. For full PWA behavior in production, host over HTTPS.
- Abbreviation search:
  - If a term isn’t found, the app shows a helpful message. Try a common term (e.g., API, HTML, CSS, JWT).

---

Built with ❤️ for developers. `by Pavan Hugar, Vibe Coding`
