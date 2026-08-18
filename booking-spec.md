# Feature Spec: Booking Widget & Booking System

## Answers to Agent's Setup Questions (read this first)

**Q: Site is static (Nginx Docker image). Which hosting approach for the API?**
A: Do NOT convert the site to server/hybrid output. Do NOT deploy anything to Coolify for this feature. The site stays exactly as-is — static build, Nginx, Docker, unchanged.
Instead: `GET /availability` and `POST /book` are built as a **separate, standalone Cloudflare Worker**, deployed independently via `wrangler`, with its own URL (e.g. `https://booking-api.baseetstudio.com`). The booking widget (a normal static/client component inside the Astro site) calls that Worker's URL directly via `fetch()` from the browser — same pattern as any external API call.
The Google OAuth env vars currently sitting in Coolify are **not used** for this feature — set fresh copies of the same four values as **Cloudflare Worker secrets** (`wrangler secret put ...`), since that's where the Google-calling code actually runs now.
Because Cloudflare Workers can't run the Node `googleapis` SDK, all Calendar API calls in the Worker must be plain `fetch()` requests to Google's REST endpoints (token refresh + Calendar API), not the SDK. This is still a proper authenticated server-to-server call — credentials never reach the browser — just without the convenience library.

**Q: The contact page already has a paper-letter ContactForm that posts to its own Cloudflare Worker. How should the booking widget sit with it?**
A: Keep them fully separate. Do not merge the booking widget into the ContactForm component, and do not touch or modify the existing ContactForm Worker. Build:
- A **new, separate Cloudflare Worker** dedicated only to booking (`/availability`, `/book`) — the existing ContactForm Worker stays untouched and unaffected.
- A **new, separate widget component** placed on the same contact page as the ContactForm, but visually and structurally distinct — e.g. its own section/card ("Prefer to book a time directly?") sitting alongside or below the paper-letter form, not inside it.
Both features can coexist on the page independently; a visitor can use either one.

---

## What It Does
A themed booking widget on the site's contact pages (all locales) lets a visitor:
1. Pick a meeting type
2. Pick an open date/time (real-time availability from Google Calendar)
3. Enter their details
4. Get a confirmed booking — event created on agency@gmail.com's Google Calendar, visitor gets an auto-emailed invite.

No double-booking. Must look native to the site — no Google/Calendly chrome. Sits alongside the existing ContactForm as a separate option, not merged into it (see answers above).

## User Flow
1. **Calendar loads** — on page load, widget calls the Worker for the current month's availability in one request (e.g. `/availability?month=2026-08`). Days with at least one open slot are shown as selectable; fully-booked or non-working days are greyed out/disabled. This gives the visitor an immediate, accurate "what's open" view — no guessing, no clicking into empty days.
2. Select meeting type (config-driven list)
3. Select a date from the calendar (only open days are clickable)
4. Selecting a date fetches that specific day's open time slots (`/availability?date=...`), shown in the visitor's local timezone with the timezone label visible
5. Enter details: name, email, phone (optional), notes — validated client + server side
6. Confirm → submit
7. Success screen: confirmation + "Add to calendar" (.ics) + note that email confirmation is on the way

## API (Cloudflare Worker, separate deployment)
Two endpoints:

**`GET /availability?month=YYYY-MM`**
- Returns which days in the month have at least one open slot (for calendar rendering) — see User Flow step 1.

**`GET /availability?date=YYYY-MM-DD&meetingType=demo`**
- Calls Google Calendar `freebusy.query` (via direct `fetch()` REST call, not the SDK) for that specific day.
- Subtract busy blocks from configured working hours; apply buffer + min-notice rules.
- Return available start times, ISO 8601 UTC.

**`POST /book`**
Body: `{ meetingTypeId, startTime, name, email, phone?, notes? }`
- Re-check slot is free immediately before booking (hard requirement — prevents race conditions from simultaneous bookers).
- Create Calendar event via Google REST API: title `${meetingType.label} — ${name}`, description = notes+phone, attendees `[agency, customer]`, `sendUpdates: "all"`, Google Meet link if virtual.
- Return event details for confirmation screen.
- Surface all errors clearly (slot taken, API failure, bad input) — never fail silently.
- CORS configured on the Worker to allow requests only from baseetstudio.com (and its locale subpaths).

## Auth (already set up once — just move the values)
The OAuth setup (Client ID/Secret/Refresh Token) is already done — no need to redo the Google login flow. Set these as **Cloudflare Worker secrets** (`wrangler secret put NAME`), exact names:
```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REFRESH_TOKEN
GOOGLE_CALENDAR_ID       # agency@gmail.com
AGENCY_TIMEZONE          # Asia/Dubai
```
Worker mints short-lived access tokens from the refresh token on each request via a plain `fetch()` POST to `https://oauth2.googleapis.com/token`.

## Config (editable without touching booking logic)
In the Worker's codebase, e.g. `src/config.ts`:
```ts
export const meetingTypes = [
  { id: "consultation", label: "Consultation Call", durationMinutes: 30, description: "..." },
  { id: "demo", label: "Product Demo", durationMinutes: 45, description: "..." },
];

export const availability = {
  workingDays: ["Mon","Tue","Wed","Thu","Fri"],
  workingHours: { start: "09:00", end: "17:00" },
  bufferMinutes: 15,
  minNoticeHours: 4,
  maxDaysAhead: 30,
};
```

## i18n
- v1 locales: `en`, `ar`, `hi`, `fil`, `ur`. Architected (not yet translated) for: `ta`, `ml`, `fr`, `ru` — adding these later = new translation file only, zero widget code changes.
- Locale read dynamically from route; no hardcoded locale list in logic.
- RTL (ar, ur now) driven by locale→direction lookup + logical CSS properties, not per-locale if/else.
- Dates/times via `Intl.DateTimeFormat(locale, …)`; API values always stay UTC.
- Missing translation keys fall back to English, never break layout.
- All widget strings go through the site's existing i18n system — nothing hardcoded.

## Other Requirements
- Honeypot or lightweight CAPTCHA on the form + rate limit `/book` on the Worker (~5/hr per IP)
- Mobile responsive
- Server-side timezone handling in UTC; visitor's browser timezone auto-detected for display only

## Acceptance Criteria
- [ ] Matches site theme, no Google/Calendly branding
- [ ] Existing ContactForm and its Worker are completely untouched
- [ ] Calendar view on load correctly shows which days are open vs. fully booked, in one request
- [ ] Impossible to double-book, incl. simultaneous attempts
- [ ] Creates correct real event on agency@gmail.com with Meet link when virtual
- [ ] Visitor gets calendar invite email automatically
- [ ] Correct across timezones
- [ ] Correct across all v1 locales incl. RTL
- [ ] Mobile responsive
- [ ] Meeting types / hours / buffer editable via config only
- [ ] Nginx/Docker static site deployment is unchanged by this feature

## Out of Scope for v1
Rescheduling/cancellation UI, payment collection, CRM sync, custom branded emails (Google's native invite only for now).