import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeCountryCode } from '../src/scripts/visitor-country.ts'

describe('normalizeCountryCode', () => {
  it('accepts a two-letter code and uppercases it', () => {
    assert.equal(normalizeCountryCode('my'), 'MY')
    assert.equal(normalizeCountryCode(' AE '), 'AE')
  })

  it('rejects anything that is not a country code', () => {
    assert.equal(normalizeCountryCode(''), null)
    assert.equal(normalizeCountryCode('UAE'), null)
    assert.equal(normalizeCountryCode('1A'), null)
    assert.equal(normalizeCountryCode(null), null)
  })
})
