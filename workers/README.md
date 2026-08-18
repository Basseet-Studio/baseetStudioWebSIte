# Cloudflare Workers

Both Workers deploy from this folder with Wrangler. The static site (Nginx / Coolify) is unchanged.

| Folder | Cloudflare name | Live URL | Secrets |
| --- | --- | --- | --- |
| [`form-handler/`](form-handler/) | `baseet-form-handler` | `https://baseet-form-handler.baseetstudio.workers.dev` | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (already on Cloudflare) |
| [`booking-api/`](booking-api/) | `booking-api` | set in `src/content/data/links.json` | `GOOGLE_*`, `AGENCY_TIMEZONE` from repo-root `.env` |

```bash
cd workers/form-handler && npm run deploy
cd workers/booking-api && npm run secrets && npm run deploy
```
