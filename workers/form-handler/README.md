# Contact form Worker (`baseet-form-handler`)

Source of truth for the already-live Worker at `https://baseet-form-handler.baseetstudio.workers.dev`.

The site posts JSON here. This Worker writes the row to D1 (`DB`) and notifies Telegram. Telegram tokens stay in the Cloudflare dashboard (already set). They are not Google booking secrets.

## Local

```bash
npm install
npm run dev
```

Telegram locally needs `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in repo-root `.env`. D1 `database_id` in `wrangler.toml` must match the existing Cloudflare database (`npx wrangler d1 list`).

## Deploy (updates the live Worker, same name)

```bash
npx wrangler login
# paste the existing D1 id into wrangler.toml if still a placeholder
npm run deploy
```

Do not `secret bulk` the Google `.env` onto this Worker. Telegram secrets are already on it.

## Schema

`schema.sql` is the `submissions` table. Only run it on a new DB:

```bash
npx wrangler d1 execute baseet-form-submissions --file=schema.sql
```
