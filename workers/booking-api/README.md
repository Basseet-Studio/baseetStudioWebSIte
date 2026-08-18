# Booking API (Cloudflare Worker)

Source: [`workers/booking-api/`](./). Form handler lives next to it in [`workers/form-handler/`](../form-handler/).

This Worker uses the **same key names** as the repo-root [`example.env`](../../example.env). Local values come from repo-root `.env`.

## Endpoints

- `GET /availability?month=YYYY-MM&meetingType=consultation`
- `GET /availability?date=YYYY-MM-DD&meetingType=consultation`
- `POST /book`

## Local dev

Needs the repo-root `.env` (same names as `example.env`). From this folder:

```bash
npm install
npm run dev
```

That symlinks `../../.env` into this folder so Wrangler can read it, then serves on `http://localhost:8787`.

## Deploy

```bash
npx wrangler login
npx wrangler kv namespace create BOOKING_LIMITS
# paste the returned id into wrangler.toml → kv_namespaces.id

npm run secrets    # uploads GOOGLE_* + AGENCY_TIMEZONE from ../../.env
npm run deploy
```

Then set `forms.booking_api_url` in `src/content/data/links.json` to the workers.dev URL Wrangler prints.

## Config

Hours, buffers, and meeting types live in `src/config.ts`. The site imports the same file so the widget and Worker cannot drift.
