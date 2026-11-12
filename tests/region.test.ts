import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { resolveRegion, type RegionSource } from '../src/lib/region.ts'

const fixture: RegionSource = {
  contact: {
    email: 'studio@example.com',
    email_link: 'mailto:studio@example.com',
    phone: '+971507566474',
    phone_display: '+971 50 756 6474',
    phone_link: 'tel:+971507566474',
    whatsapp: '+971507566474',
    whatsapp_link: 'https://wa.me/971507566474',
    address: 'Abu Dhabi - UAE',
  },
  regions: {
    default: 'AE',
    countries: {
      AE: {
        languages: ['en', 'ar', 'ur', 'hi', 'fil'],
        defaultLanguage: 'en',
      },
      MY: {
        languages: ['en', 'ms', 'ta', 'zh', 'not-a-lang'],
        defaultLanguage: 'en',
        contact: {
          phone: '',
          phone_display: '  ',
          whatsapp: '+60123456789',
          whatsapp_link: 'https://wa.me/60123456789',
        },
        office: 'Kuala Lumpur',
      },
    },
  },
}

describe('resolveRegion', () => {
  it('uses the UAE profile when the country is unknown', () => {
    const region = resolveRegion(null, fixture)
    assert.equal(region.regionCode, 'AE')
    assert.equal(region.countryCode, null)
    assert.deepEqual(region.languages, ['en', 'ar', 'ur', 'hi', 'fil'])
    assert.equal(region.defaultLanguage, 'en')
    assert.equal(region.contact.phone, '+971507566474')
  })

  it('uses the UAE profile for a country with no entry', () => {
    const region = resolveRegion('de', fixture)
    assert.equal(region.countryCode, 'DE')
    assert.equal(region.regionCode, 'AE')
    assert.equal(region.contact.phone_display, '+971 50 756 6474')
  })

  it('loads Malaysia languages and keeps empty contact fields on the UAE number', () => {
    const region = resolveRegion('my', fixture)
    assert.equal(region.regionCode, 'MY')
    assert.deepEqual(region.languages, ['en', 'ms', 'ta', 'zh'])
    assert.equal(region.defaultLanguage, 'en')
    assert.equal(region.contact.phone, '+971507566474')
    assert.equal(region.contact.phone_display, '+971 50 756 6474')
    assert.equal(region.contact.phone_link, 'tel:+971507566474')
    assert.equal(region.contact.whatsapp, '+60123456789')
    assert.equal(region.contact.whatsapp_link, 'https://wa.me/60123456789')
    assert.equal(region.contact.email, 'studio@example.com')
    assert.equal(region.raw.office, 'Kuala Lumpur')
  })
})

describe('links.json regions', () => {
  const links = JSON.parse(
    readFileSync(join(import.meta.dirname, '../src/content/data/links.json'), 'utf8'),
  ) as RegionSource

  it('offers the current languages in the UAE and Malay, Tamil, Chinese, and English in Malaysia', () => {
    const uae = resolveRegion(null, links)
    assert.deepEqual(uae.languages, ['en', 'ar', 'ur', 'hi', 'fil'])
    assert.equal(uae.contact.phone_display, '+971 50 756 6474')

    const malaysia = resolveRegion('MY', links)
    assert.deepEqual(malaysia.languages, ['en', 'ms', 'ta', 'zh'])
    assert.equal(malaysia.defaultLanguage, 'en')
    assert.equal(malaysia.contact.phone, links.contact.phone)
    assert.equal(malaysia.contact.whatsapp_link, links.contact.whatsapp_link)
  })
})
