# Contract: Visitor Detection Module

**File**: `baseetstudiosite2/src/scripts/visitor-detect.ts`
**Type**: Client-side TypeScript module
**Trigger**: Imported and called from `Base.astro` layout on `DOMContentLoaded` and `astro:page-load` events
**Output**: Populates `<p id="visitor-info">` in the footer with device + country text

## Purpose

Detect the visitor's device type (Mobile / Tablet / Desktop) and country (via public IP geolocation APIs) and display a discreet one-line indicator at the bottom of the footer. Mirrors the behavior of the old Hugo site's `baseetStudioWebSIte/assets/js/visitor-detect.js`.

## Public API

```typescript
export function init(): void
```

Idempotent — safe to call multiple times. Returns early if `#visitor-info` is not on the page.

## DOM Contract

The function expects the following element to exist on the page:

```html
<p
  id="visitor-info"
  data-visiting="Visiting from"
  data-device="Device"
  data-unknown="Unknown"
></p>
```

`data-visiting`, `data-device`, and `data-unknown` are the i18n labels (English defaults). After the function runs successfully, the `textContent` of the element will be set to one of:

- `Visiting from {Country} · Device {type}` (success)
- `Visiting from Unknown · Device {type}` (geo failed, device still detected)
- The element is left untouched if the function returns early (e.g. element missing)

**XSS safety**: only `textContent` is used. The `data-*` attribute values are read via `getAttribute` and interpolated into a string via template literals — no `innerHTML`.

## Behaviour

### Device detection

Read `navigator.userAgent` and classify:

| User agent matches | Device |
|---|---|
| `/Mobi\|Android.*Mobile\|iPhone\|iPod\|BlackBerry\|IEMobile\|Opera Mini/i` | `Mobile` |
| `/iPad\|Android(?!.*Mobile)\|Tablet/i` | `Tablet` |
| (default) | `Desktop` |

### Country detection

1. Check `sessionStorage.getItem('baseet_visitor_country')` — if present, use it directly (no network call).
2. Otherwise, `fetch('https://ipapi.co/json/')` with a 3-second `AbortController` timeout.
   - On 2xx response with `country_name` field, use the value.
   - On timeout, network error, or non-2xx, fall through to step 3.
3. `fetch('https://ip-api.com/json/?fields=country')` with a 3-second timeout.
   - On 2xx response with `country` field, use the value.
   - On any failure, use `'Unknown'`.
4. If a non-empty country was resolved, `sessionStorage.setItem('baseet_visitor_country', country)`.

### Write result

After both detections complete (country is the slower one — async), write:

```typescript
el.textContent = `${visitingLabel}: ${country} · ${deviceLabel}: ${device}`
```

If the country promise is still pending when the function returns, the write happens inside the `.then()` callback. The device label is set immediately (synchronous).

## Implementation

```typescript
// src/scripts/visitor-detect.ts

const CACHE_KEY = 'baseet_visitor_country'
const TIMEOUT_MS = 3000

function detectDevice(): 'Mobile' | 'Tablet' | 'Desktop' {
  const ua = navigator.userAgent || ''
  if (/Mobi|Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return 'Mobile'
  }
  if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) {
    return 'Tablet'
  }
  return 'Desktop'
}

function fetchWithTimeout(url: string, ms: number): Promise<any> {
  return Promise.race([
    fetch(url).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json()
    }),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), ms)
    }),
  ])
}

function detectCountry(): Promise<string> {
  let cached: string | null = null
  try {
    cached = sessionStorage.getItem(CACHE_KEY)
  } catch { /* sessionStorage unavailable */ }
  if (cached) return Promise.resolve(cached)

  return fetchWithTimeout('https://ipapi.co/json/', TIMEOUT_MS)
    .then(data => (data && data.country_name ? String(data.country_name) : ''))
    .catch(() =>
      fetchWithTimeout('https://ip-api.com/json/?fields=country', TIMEOUT_MS)
        .then(data => (data && data.country ? String(data.country) : ''))
        .catch(() => ''),
    )
    .then(country => {
      if (country) {
        try { sessionStorage.setItem(CACHE_KEY, country) } catch { /* ignore */ }
      }
      return country
    })
}

export function init(): void {
  const el = document.getElementById('visitor-info')
  if (!el) return

  const visitingLabel = el.getAttribute('data-visiting') || 'Visiting from'
  const deviceLabel = el.getAttribute('data-device') || 'Device'
  const unknownLabel = el.getAttribute('data-unknown') || 'Unknown'

  const device = detectDevice()

  detectCountry().then(country => {
    const countryText = country || unknownLabel
    el.textContent = `${visitingLabel}: ${countryText} · ${deviceLabel}: ${device}`
  })
}
```

## Wiring in Base.astro

```astro
<script>
  import { init } from '../scripts/visitor-detect'

  const run = () => init()

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run)
  } else {
    run()
  }

  // Re-run on Astro view transitions (page changes without full reload)
  document.addEventListener('astro:page-load', run)
</script>
```

Place this `<script>` block just before `</body>` in `Base.astro`. Astro will bundle and hash the script; the import is resolved at build time.

## Failure modes

| Failure | Behaviour |
|---|---|
| `#visitor-info` element missing | Function returns early, no error, no console message |
| `navigator.userAgent` undefined | `detectDevice()` returns `'Desktop'` (fallback) |
| `sessionStorage` throws (private mode) | Catch and continue; country is re-fetched every page load |
| `ipapi.co` 3s timeout | Falls through to `ip-api.com` |
| `ip-api.com` 3s timeout | Country becomes `'Unknown'`, device label still set, line still renders |
| Both APIs return 5xx | Same as timeout — country `'Unknown'` |
| Network completely offline | Same as timeout — country `'Unknown'`, no console error |
| Geo response has `country_name` but it's an empty string | Treated as failure, falls through |
| User clears sessionStorage mid-session | Country re-fetched on next page load |
| `textContent` setter throws (extremely rare) | Unhandled — but only happens if the element is detached mid-write |

No failure mode produces a console error or blocks the page render.

## Performance

- Two network requests at most (1 to ipapi.co, 1 to ip-api.com on fallback)
- 3-second hard timeout per request
- Country cached in sessionStorage — only the first page load hits the network
- Device detection is synchronous and microsecond-fast
- No DOM thrash — single `textContent` write per page load
- `textContent` is the cheapest way to update a text node

## Privacy

- No cookies, no localStorage, no fingerprinting
- Only sends the user's public IP to the two public geo APIs (which they already see via standard HTTPS)
- No PII stored anywhere
- The displayed line is visible to the user — fully transparent

## Testing

Manual verification (no automated test framework in this repo):

1. Load `http://localhost:4321/` — within 4 seconds, scroll to footer. Text reads `Visiting from {your country} · Device Desktop` (or Mobile/Tablet per UA).
2. Reload the page — same text, no second network request (verify in Network tab).
3. Open DevTools → Application → Session Storage → delete `baseet_visitor_country` → reload — country re-fetches.
4. DevTools → Network → block `https://ipapi.co` → reload — country shows via `ip-api.com` fallback.
5. DevTools → Network → block both APIs → reload — text shows `Visiting from Unknown · Device {type}`.
6. Open in mobile UA emulation — text shows `Device Mobile`.
7. Open in tablet UA emulation — text shows `Device Tablet`.
8. Navigate between pages via Astro ViewTransitions — text updates correctly on each page (proves the `astro:page-load` listener fires).
