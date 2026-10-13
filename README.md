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

RSVP is handled by the serverless API route [api/rsvp.ts](api/rsvp.ts).

### Durable storage (required before sharing with guests)

Without a database, responses live in `/tmp` on one serverless instance and **will be lost** on cold starts and redeploys.
Connect Upstash Redis (Vercel dashboard → Storage / Marketplace → Upstash Redis → connect to this project). That adds
`KV_REST_API_URL` and `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`), which the API
picks up automatically. The admin view shows a warning while storage is still temporary.

### Admin access

- Set `RSVP_ADMIN_TOKEN` in Vercel to a random secret of **at least 24 characters**
  (e.g. `openssl rand -base64 32`). Shorter tokens are refused.
- Open `https://<your-site>/?admin=1`, enter the key, and click VIEW RESPONSES.
- `?admin=1` only reveals the form; the server checks the token on every request.

### Server-side protections

- Attendance and guest count must match `rsvp.attendanceOptions` / `rsvp.guestOptions` in `wedding.json`
- Name 2–80 characters, message ≤ 400, request body ≤ 4 KB, JSON only
- Rate limits per IP: 5 RSVPs / 10 min, 10 admin attempts / 15 min (shared across instances when Redis is connected)
- Honeypot field for simple bots; declines are stored with 0 guests

## Calendar times

Event times are Indian Standard Time. "Add to Google" and the `.ics` download are written as IST with an explicit
`Asia/Kolkata` zone, so guests abroad see the correct local time and the event details still say IST.
Order of precedence for an event's start: `startDateTime` → `dateLabel` + `time` → `countdownDate`.

## Link previews (WhatsApp, iMessage, Telegram)

The preview card is `public/assets/og/share.jpg` (1200×630, ~150 KB). `index.html` points to it with an absolute URL on
`https://thilagavathi-meganathan-invite.vercel.app`; if you move to a custom domain, update `og:url`, `og:image`,
`twitter:image` and `canonical` there.

WhatsApp caches previews per link. If you've already shared the link, the old preview may stick for a while:
share it with a harmless query string the first time (e.g. `…vercel.app/?v=2`) to force a fresh preview.

## Custom domain setup (Vercel)

1. Open Vercel dashboard and select your project.
2. Go to Settings -> Domains.
3. Add your domain (example: invite.yourdomain.com).
4. In your domain provider DNS, add the records Vercel shows.
5. Wait for DNS verification to complete in Vercel.
6. Mark the new domain as Primary.

After domain is active, update social meta URLs in [index.html](index.html) if you want fully qualified image links for some messaging apps.

## Palette

Defined once in `:root` in `src/styles.css`; everything else uses these tokens or `color-mix()` of them.

| Token | Hex | Used for |
| --- | --- | --- |
| `--cream` | `#F7F1E8` | page background, the connecting colour |
| `--cream-2` | `#EFE5D8` | RSVP section, photo placeholders |
| `--ink` | `#33252E` | text, buttons, celebration gradient start |
| `--burgundy` | `#5A3540` | celebration gradient end |
| `--terracotta` | `#B96A56` | countdown, large accents on cream |
| `--forest` | `#173D32` | hero base, footer, music button |
| `--gold` | `#B89A61` | rules and underlines |
| `--gold-soft` | `#E2CF9A` | accents on dark sections |
| `--white` | `#FFF9F2` | text on dark sections |

Derived: `--terracotta-deep` (small accent text on cream, 5.2:1), `--ink-muted` (body copy, 6.6:1), `--line`, `--on-dark-muted`.

## Accessibility

`prefers-reduced-motion: reduce` turns off parallax, reveal fades and slide-ins (Motion `MotionConfig` + `useReducedMotion`), as well as CSS animations.
