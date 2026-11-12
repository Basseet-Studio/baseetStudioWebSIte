// Independent visitor-country detector.
// Other systems subscribe; this module does not know about languages, phones, or the DOM.
//
//   onVisitorCountry(({ code }) => {
//     const region = resolveRegion(code, links)
//     // region.languages, region.contact, region.raw
//   })

export type VisitorCountry = {
  /** ISO 3166-1 alpha-2, uppercase. Null when the lookup failed. */
  code: string | null
}

type Listener = (country: VisitorCountry) => void

const CACHE_KEY = 'baseet_visitor_country_code'
const TIMEOUT_MS = 3000

let current: VisitorCountry | null = null
let pending: Promise<VisitorCountry> | null = null
const listeners = new Set<Listener>()

/** Keep a two-letter country code, or return null. */
export function normalizeCountryCode(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const code = value.trim().toUpperCase()
  return /^[A-Z]{2}$/.test(code) ? code : null
}

function readCache(): string | null {
  try {
    return normalizeCountryCode(sessionStorage.getItem(CACHE_KEY))
  } catch {
    return null
  }
}

function writeCache(code: string): void {
  try {
    sessionStorage.setItem(CACHE_KEY, code)
  } catch {
    /* sessionStorage unavailable (private mode) */
  }
}

function fetchWithTimeout(url: string, ms: number): Promise<unknown> {
  return Promise.race([
    fetch(url).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json() as Promise<unknown>
    }),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), ms)
    }),
  ])
}

function codeFromPayload(data: unknown, key: string): string | null {
  if (!data || typeof data !== 'object') return null
  return normalizeCountryCode((data as Record<string, unknown>)[key])
}

function lookupCountryCode(): Promise<string | null> {
  const cached = readCache()
  if (cached) return Promise.resolve(cached)

  return fetchWithTimeout('https://ipapi.co/json/', TIMEOUT_MS)
    .then((data) => codeFromPayload(data, 'country_code'))
    .catch(() =>
      fetchWithTimeout('https://ip-api.com/json/?fields=countryCode', TIMEOUT_MS)
        .then((data) => codeFromPayload(data, 'countryCode'))
        .catch(() => null),
    )
    .then((code) => {
      if (code) writeCache(code)
      return code
    })
}

function publish(country: VisitorCountry): void {
  current = country
  for (const listener of listeners) listener(country)
}

/** Latest result, or null while the first lookup is still running. */
export function getVisitorCountry(): VisitorCountry | null {
  return current
}

/**
 * Subscribe to the country result. If a result is already known, the listener
 * runs immediately. Returns an unsubscribe function.
 */
export function onVisitorCountry(listener: Listener): () => void {
  listeners.add(listener)
  if (current) listener(current)
  return () => {
    listeners.delete(listener)
  }
}

/** Start the lookup once. Safe to call again after a page swap. */
export function initVisitorCountry(): void {
  if (typeof window === 'undefined') return
  if (pending) return
  pending = lookupCountryCode()
    .then((code) => {
      const country = { code }
      publish(country)
      return country
    })
    .catch(() => {
      const country = { code: null }
      publish(country)
      return country
    })
}
