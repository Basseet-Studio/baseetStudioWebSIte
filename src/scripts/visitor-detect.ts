// visitor-detect.ts
// Detect the visitor's device (Mobile / Tablet / Desktop) and country (via
// public IP geolocation APIs), then write a discreet one-line indicator into
// the footer's <p id="visitor-info"> element. Ported from the old Hugo site's
// assets/js/visitor-detect.js with TypeScript types.

const CACHE_KEY = 'baseet_visitor_country_code'
const TIMEOUT_MS = 3000

type Device = 'mobile' | 'tablet' | 'desktop'

function detectDevice(): Device {
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || ''
  if (/Mobi|Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return 'mobile'
  }
  if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) {
    return 'tablet'
  }
  return 'desktop'
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

function detectCountryCode(): Promise<string> {
  let cached: string | null = null
  try {
    cached = sessionStorage.getItem(CACHE_KEY)
  } catch {
    /* sessionStorage unavailable (private mode) — ignore */
  }
  if (cached) return Promise.resolve(cached)

  return fetchWithTimeout('https://ipapi.co/json/', TIMEOUT_MS)
    .then(data => (data && data.country_code ? String(data.country_code) : ''))
    .catch(() =>
      fetchWithTimeout('https://ip-api.com/json/?fields=countryCode', TIMEOUT_MS)
        .then(data => (data && data.countryCode ? String(data.countryCode) : ''))
        .catch(() => ''),
    )
    .then(code => {
      if (code) {
        try {
          sessionStorage.setItem(CACHE_KEY, code)
        } catch {
          /* ignore */
        }
      }
      return code
    })
}

function countryName(code: string, lang: string): string {
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(code.toUpperCase()) || code
  } catch {
    return code
  }
}

export function init(): void {
  if (typeof document === 'undefined') return
  const el = document.getElementById('visitor-info')
  if (!el) return

  const lang = el.dataset.lang || 'en'
  const template = el.dataset.template || 'Visiting from {country} · {device}'
  const unknownLabel = el.dataset.unknown || 'somewhere'
  const device = detectDevice()
  const deviceLabel = el.getAttribute(`data-device-${device}`) || device

  detectCountryCode().then(code => {
    const countryText = code ? countryName(code, lang) : unknownLabel
    // textContent only — never innerHTML — to prevent XSS from a malicious geo response.
    el.textContent = template.replace('{country}', countryText).replace('{device}', deviceLabel)
  })
}
