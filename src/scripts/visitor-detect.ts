// Footer visitor line. Country comes from visitor-country; this file only paints the sentence.

import { getVisitorCountry, onVisitorCountry, type VisitorCountry } from './visitor-country'

type Device = 'mobile' | 'tablet' | 'desktop'

let subscribed = false

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

function countryName(code: string, lang: string): string {
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(code.toUpperCase()) || code
  } catch {
    return code
  }
}

function paint(country: VisitorCountry): void {
  const el = document.getElementById('visitor-info')
  if (!el) return

  const lang = el.dataset.lang || 'en'
  const template = el.dataset.template || 'Visiting from {country} · {device}'
  const unknownLabel = el.dataset.unknown || 'somewhere'
  const device = detectDevice()
  const deviceLabel = el.getAttribute(`data-device-${device}`) || device
  const countryText = country.code ? countryName(country.code, lang) : unknownLabel
  // textContent only — never innerHTML — to prevent XSS from a malicious geo response.
  el.textContent = template.replace('{country}', countryText).replace('{device}', deviceLabel)
}

export function init(): void {
  if (typeof document === 'undefined') return
  if (!subscribed) {
    subscribed = true
    onVisitorCountry(paint)
    return
  }
  const country = getVisitorCountry()
  if (country) paint(country)
}
