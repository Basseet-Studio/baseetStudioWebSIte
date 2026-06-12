// visitor-detect.ts
// Detect the visitor's device (Mobile / Tablet / Desktop) and country (via
// public IP geolocation APIs), then write a discreet one-line indicator into
// the footer's <p id="visitor-info"> element. Ported from the old Hugo site's
// assets/js/visitor-detect.js with TypeScript types.

const CACHE_KEY = 'baseet_visitor_country'
const TIMEOUT_MS = 3000

type Device = 'Mobile' | 'Tablet' | 'Desktop'

function detectDevice(): Device {
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || ''
  if (/Mobi|Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return 'Mobile'
  }
  if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) {
    return 'Tablet'
  }
  return 'Desktop'
}

function fetchWithTimeout(url: string, ms: number): Promise<any> {
  return Promise.race<any>([
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
  } catch {
    /* sessionStorage unavailable (private mode) — ignore */
  }
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
        try {
          sessionStorage.setItem(CACHE_KEY, country)
        } catch {
          /* ignore */
        }
      }
      return country
    })
}

export function init(): void {
  if (typeof document === 'undefined') return
  const el = document.getElementById('visitor-info')
  if (!el) return

  const visitingLabel = el.getAttribute('data-visiting') || 'Visiting from'
  const deviceLabel = el.getAttribute('data-device') || 'Device'
  const unknownLabel = el.getAttribute('data-unknown') || 'Unknown'

  const device = detectDevice()

  detectCountry().then(country => {
    const countryText = country || unknownLabel
    // textContent only — never innerHTML — to prevent XSS from a malicious geo response.
    el.textContent = `${visitingLabel}: ${countryText} · ${deviceLabel}: ${device}`
  })
}
