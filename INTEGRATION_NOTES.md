# Design Integration Notes

The Magic Patterns landing page export has been fully merged into the Next.js frontend.

## What was done
- All 9 components ported from TS/Vite (`src/components/*.tsx`) to JS/Next.js
  (`frontend/components/landing/*.jsx`): Navbar, Hero, HowItWorks, Features,
  Security, CallToAction, Footer, RecordDiagram, EmergencyCard.
- `react-router`/anchor-only links converted to `next/link` (`/login`, `/register`).
- Tailwind tokens merged into `frontend/tailwind.config.js` — the new
  `paper` / `ink` / `alert` palette and `display`/`sans`/`mono` fonts now sit
  alongside the existing `primary`/`medical` palette and animation keyframes
  used elsewhere in the app, so nothing on your dashboard/records/hospital
  pages breaks.
- Google Fonts (Inter, Instrument Serif, IBM Plex Mono) and the ruled-paper /
  trace-line CSS effects added to `frontend/styles/globals.css`.
- `homeContent.ts` ported to `frontend/data/homeContent.js`.
- New deps (`framer-motion`, `lucide-react`, `three`) added to
  `frontend/package.json`.
- `pages/index.js` now renders the new landing page (Navbar, Hero,
  HowItWorks, Features, Security, CallToAction, Footer).

## Verified
- `npx next build` compiles successfully, all 11 routes prerender
  (`/`, `/login`, `/register`, `/dashboard`, `/profile`, `/records`,
  `/records/upload`, `/emergency/[pulseId]`, `/hospital/scan`, `/404`).
- All backend files pass `node --check` (syntax-clean).

## Not included in this zip (regenerate locally)
- `node_modules` in both `frontend/` and `backend/` — run `npm install` in each.
- `.next` build output — run `npm run build` or `npm run dev`.

## How to run
```bash
# backend
cd backend
npm install
# create a .env with your MongoDB URI, JWT secret, Gemini/Cloudinary keys etc.
npm start

# frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Known open item (from earlier audit)
The hospital OTP consent UI is still missing on the frontend despite the
backend implementation being complete — worth picking up next.
