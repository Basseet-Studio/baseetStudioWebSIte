# Cloudflare Worker — Contact Form Handler
## Implementation Spec for Developer Agent
**Project:** Baseet Studio Website
**Stack:** Hugo static site + Cloudflare Worker + D1 Database + Telegram Bot API

---

## Overview

Replace the current Web3Forms integration with a self-hosted Cloudflare Worker.

The Hugo site already has a fully working AJAX form with success/error feedback. The JavaScript already uses `fetch()` and handles all UI states. **The only change to the Hugo codebase is one line** — the form action URL. Everything else on the frontend stays untouched.

The Worker receives the POST, saves to D1, and fires a Telegram notification.

---

## Part 1 — Cloudflare Worker

### 1.1 Create the Worker

In the Cloudflare dashboard (or via Wrangler CLI):
- Create a new Worker named `baseet-form-handler`
- It will be available at: `https://baseet-form-handler.<your-subdomain>.workers.dev`

### 1.2 Create the D1 Database

```bash
wrangler d1 create baseet-forms-db
```

Copy the `database_id` from the output into `wrangler.toml`.

### 1.3 wrangler.toml

```toml
name = "baseet-form-handler"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "baseet-forms-db"
database_id = "PASTE_YOUR_DATABASE_ID_HERE"
```

### 1.4 D1 Schema

Run once to create the table:

```sql
CREATE TABLE IF NOT EXISTS submissions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  submitted_at TEXT    DEFAULT (datetime('now')),
  page        TEXT,
  language    TEXT,
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL,
  phone       TEXT,
  message     TEXT    NOT NULL,
  ip_address  TEXT
);
```

Run with:
```bash
wrangler d1 execute baseet-forms-db --file=schema.sql
```

### 1.5 Environment Variables (Secrets)

Set these via Wrangler — never hardcode in source:

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
```

Values provided separately by client.

### 1.6 Worker Code — src/index.js

```javascript
export default {
  async fetch(request, env) {

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // CORS headers — allow requests from the Baseet Studio domain
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // tighten to your domain in production
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Parse form data
      const formData = await request.formData();

      const name     = (formData.get('name')     || '').trim();
      const email    = (formData.get('email')    || '').trim();
      const phone    = (formData.get('phone')    || '').trim();
      const message  = (formData.get('message')  || '').trim();
      const page     = (formData.get('page')     || 'Unknown').trim();
      const language = (formData.get('language') || 'unknown').trim();
      const ip       = request.headers.get('CF-Connecting-IP') || 'unknown';

      // Basic validation
      if (!name || !email || !message) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required fields' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid email address' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Save to D1
      await env.DB.prepare(`
        INSERT INTO submissions (page, language, name, email, phone, message, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(page, language, name, email, phone || null, message, ip).run();

      // Send Telegram notification (non-blocking — failure doesn't break the response)
      sendTelegram(env, { name, email, phone, message, page, language, ip }).catch(() => {});

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );

    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: 'Server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  }
};

async function sendTelegram(env, { name, email, phone, message, page, language, ip }) {
  const text = [
    `📬 <b>New Contact Form Submission</b>`,
    ``,
    `👤 <b>Name:</b> ${escapeHtml(name)}`,
    `📧 <b>Email:</b> ${escapeHtml(email)}`,
    phone ? `📞 <b>Phone:</b> ${escapeHtml(phone)}` : null,
    `💬 <b>Message:</b>`,
    escapeHtml(message),
    ``,
    `🌐 <b>Page:</b> ${escapeHtml(page)}`,
    `🗣 <b>Language:</b> ${escapeHtml(language)}`,
    `🔌 <b>IP:</b> ${ip}`,
  ].filter(line => line !== null).join('\n');

  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
    }),
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
```

### 1.7 Deploy

```bash
wrangler deploy
```

Note the Worker URL from the output — you will need it for Part 2.

---

## Part 2 — Hugo Template Change

**File to edit:** The Hugo partial that contains the contact form.
Look in `layouts/partials/` or `themes/[theme]/layouts/partials/` for a file containing `quick-contact-form` or the form markup shared above.

### The only change required

Find this line in the `<form>` element:

```html
action="https://api.web3forms.com/submit"
```

Replace with your Cloudflare Worker URL:

```html
action="https://baseet-form-handler.<your-subdomain>.workers.dev"
```

### Also remove these hidden inputs — they are Web3Forms-specific and not needed:

```html
<input type="hidden" name="access_key" value="bec4456c-9b97-4528-b493-1189ef3d3969">
<input type="hidden" name="subject" value="Quick Contact Form - Baseet Studio">
```

### Keep these hidden inputs — they carry useful metadata to the Worker:

```html
<input type="hidden" name="page" value="{{ $pageName }}">
<input type="hidden" name="language" value="{{ site.Language.Lang }}">
```

### The JavaScript block — NO CHANGES NEEDED

The existing `<script>` block already:
- Intercepts submit with `event.preventDefault()`
- Sends via `fetch()` with `FormData`
- Shows success/error feedback based on `response.ok`
- Resets the form on success
- Re-enables the button in `finally`

The Worker returns `200` with `{ success: true }` on success — `response.ok` will be `true` and the existing success UI will trigger correctly. No JS changes required.

### Rebuild

```bash
npm run build
```

Deploy as normal.

---

## Part 3 — CORS Note

The Worker currently sets `Access-Control-Allow-Origin: *`.

Once confirmed working, tighten this to your actual domain:

```javascript
'Access-Control-Allow-Origin': 'https://baseetstudio.com',
```

Replace with whatever your actual production domain is.

---

## Part 4 — Viewing Submissions

Submissions are stored in D1 forever (free tier: 5GB storage, 5M reads/day).

To query them:

```bash
wrangler d1 execute baseet-forms-db --command="SELECT * FROM submissions ORDER BY submitted_at DESC LIMIT 50;"
```

Or use the Cloudflare dashboard → D1 → your database → Console tab.

---

## Checklist Before Going Live

- [ ] Worker deployed and URL confirmed
- [ ] D1 database created and schema applied
- [ ] `TELEGRAM_BOT_TOKEN` secret set
- [ ] `TELEGRAM_CHAT_ID` secret set
- [ ] Hugo template updated — action URL changed, Web3Forms hidden inputs removed
- [ ] Site rebuilt with `npm run build` and deployed
- [ ] Test submission sent from live site
- [ ] Telegram notification received on client phone
- [ ] Row visible in D1 via dashboard or Wrangler CLI
- [ ] CORS origin tightened to production domain

---

## What the Client Provides

| Item | Notes |
|---|---|
| Telegram Bot Token | Client sets up bot via @BotFather on Telegram |
| Telegram Chat ID | Client retrieves from Telegram API after bot setup |
| Cloudflare account access | Client creates account, adds agent as member OR shares login |

---

## Free Tier Limits (Cloudflare)

| Resource | Free Limit | Your usage |
|---|---|---|
| Worker requests | 100,000 / day | Form submissions — nowhere near this |
| D1 storage | 5 GB | Text submissions — negligible |
| D1 reads | 5M / day | Negligible |
| D1 writes | 100K / day | Negligible |

Effectively free forever for this use case.