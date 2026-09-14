# Config-Driven Wedding Invitation — Creative Edition

A React + TypeScript + Vite + Motion wedding invitation designed as a premium editorial microsite.

## Design direction

This version intentionally does **not** copy the reference site's section layout.

It uses:
- cinematic full-screen hero
- oversized date typography
- asymmetric couple portraits
- "His Forever / Her Forever" roles
- family-oriented invitation copy (no fabricated love-story timeline)
- event cards with integrated Google Maps links
- large countdown treatment
- editorial gallery wall
- minimal RSVP
- cinematic closing section
- Motion animations and parallax
- responsive mobile-first layout

## Configuration

All wedding-specific content lives in:

`public/config/wedding.json`

You can change:
- bride/groom names
- roles
- parents
- portraits
- invitation text
- events
- dates and times
- venues and addresses
- Google Maps URLs
- hero image
- gallery images
- music
- RSVP options
- footer message

React components should not need to be edited for normal wedding customization.

## Assets

Put images under:

`public/assets/photos/`

Put music under:

`public/assets/audio/`

Use the paths from `wedding.json`.

## Run

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

The production output is generated in `dist/`.

## Deploy

Push this project to GitHub and import the repository into Vercel.

Vercel settings:
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Set environment variable in Vercel project settings:

- `RSVP_ADMIN_TOKEN` = your secret admin key

## RSVP storage and admin access

RSVP is handled by serverless API route [api/rsvp.ts](api/rsvp.ts).

Draft behavior note:
- In Vercel serverless, responses are stored in temporary runtime storage.
- Data can reset on new deployments or cold starts.
- This is fine for draft/demo sharing.
- For production, use a database (Supabase/Firebase/etc.).

Response viewing is admin-only:
1. Set an environment variable before running dev server:

```bash
export RSVP_ADMIN_TOKEN="your-secret-key"
npm run dev
```

2. Open the site with admin mode query param:

```text
http://localhost:5173/?admin=1
```

3. In the RSVP section, enter the same admin key and click VIEW RESPONSES.

Guests can submit RSVP normally, but cannot view responses without the admin token.


## High-contrast palette

This edition uses a brighter modern wedding palette:
- Warm porcelain: `#FBF7EF`
- Deep plum-charcoal: `#241F24`
- Terracotta: `#B96A56`
- Soft rose: `#E8A18F`
- Deep plum/burgundy: `#33252E` → `#5A3540`

Supporting text, labels and form controls have been enlarged for better mobile readability.
