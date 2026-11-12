// Applies the resolved region to the language menu and contact links.
// Listens to visitor-country; it does not detect the country itself.
//
// Future features can also listen for `baseet:visitor-region` on document.
// `event.detail` is the ResolvedRegion, including `raw` for new config keys.

import linksData from '../content/data/links.json'
import { resolveRegion, type ResolvedRegion } from '../lib/region'
import { getVisitorCountry, onVisitorCountry, type VisitorCountry } from './visitor-country'

let subscribed = false

function applyLanguages(region: ResolvedRegion): void {
  const current = document.body?.dataset.lang ?? ''
  document.querySelectorAll<HTMLElement>('[data-lang-option]').forEach((el) => {
    const code = el.dataset.locale ?? ''
    const offered = region.languages.some((lang) => lang === code)
    el.hidden = !offered && code !== current
  })
}

function applyContact(region: ResolvedRegion): void {
  document.querySelectorAll<HTMLAnchorElement>('[data-region-contact="phone"]').forEach((el) => {
    if (region.contact.phone_link) el.href = region.contact.phone_link
    if (el.dataset.regionContactText === 'true' && region.contact.phone_display) {
      el.textContent = region.contact.phone_display
    }
  })
  document.querySelectorAll<HTMLAnchorElement>('[data-region-contact="whatsapp"]').forEach((el) => {
    if (region.contact.whatsapp_link) el.href = region.contact.whatsapp_link
  })
  document.querySelectorAll<HTMLAnchorElement>('[data-region-contact="email"]').forEach((el) => {
    if (region.contact.email_link) el.href = region.contact.email_link
    if (el.dataset.regionContactText === 'true' && region.contact.email) {
      el.textContent = region.contact.email
    }
  })
}

function apply(country: VisitorCountry): void {
  const region = resolveRegion(country.code, linksData)
  applyLanguages(region)
  applyContact(region)
  document.dispatchEvent(new CustomEvent('baseet:visitor-region', { detail: region }))
}

export function initRegionUi(): void {
  if (typeof document === 'undefined') return
  if (!subscribed) {
    subscribed = true
    onVisitorCountry(apply)
    return
  }
  const country = getVisitorCountry()
  if (country) apply(country)
}
