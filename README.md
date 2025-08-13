# Dev Notes

A modern, visually appealing note-taking app built for developers. Save titles, URLs, code snippets, and tags; search and filter quickly; look up abbreviations; and install it as a desktop-like PWA.

## Tech Stack

- React 19 + TypeScript + Vite
- PrismJS for code syntax highlighting
- CSS for a dark, modern UI
- LocalStorage for persistence (no backend required)
- PWA (manifest + service worker) for offline and installable experience

## Getting Started

### Prerequisites
- Node.js (LTS) and npm

### Install dependencies
```bash
npm install
```

### Run in development
```bash
npm run dev
```
Open the printed local URL (e.g., http://localhost:5173).

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

## Install as Desktop-like App (PWA)

- Chrome/Edge: Open the app URL → click the install icon in the address bar (or 3-dots menu → Install).
- Windows shortcut: This creates a Start Menu entry and desktop icon. It opens in its own window without the browser UI.
- Offline: The app works offline thanks to the service worker.

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
  - Notes are saved in the browser at the key `dev-notes`
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
5. Click Add Note (button is on its own row for alignment).
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

- Notes are stored locally via `localStorage` under the key `dev-notes`.
- To reset, clear the app storage in your browser devtools or remove that key.

## Future Enhancements

- AI-assisted features
  - Smart tag suggestions, related links, and code explanations
  - Semantic search across notes (“how to debounce in React”)
  - Agentic workflows to auto-collect references for saved snippets
- Sync & Collaboration
  - User accounts, cloud sync across devices, shared notebooks
- Import/Export
  - JSON/Markdown export, bulk import
- Rich Code Support
  - Language selection per snippet; load Prism components dynamically
- Integrations
  - VSCode extension, browser extension, Slack/Teams commands
- Keyboard Shortcuts
  - Quick add, quick search, toggle expand/collapse

## Troubleshooting

- PWA install icon not visible: Ensure you’re running via `npm run dev`/`npm run preview` and open the served URL in Chrome/Edge. For full PWA behavior in production, host over HTTPS.
- Abbreviation search: If a term isn’t found, the app shows a helpful message. Try a common term (e.g., API, HTML, CSS, JWT).

---

Built with ❤️ for developers. `by Pavan Hugar, Vibe Coding`
