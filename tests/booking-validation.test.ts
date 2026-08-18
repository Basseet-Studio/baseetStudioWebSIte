import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeBookingDetails, validateBookingDetails } from '../src/scripts/booking-validation.ts'
import { validateBookBody } from '../workers/booking-api/src/validate.ts'

describe('validateBookingDetails', () => {
  it('requires name and email', () => {
    const result = validateBookingDetails({
      name: '',
      email: '',
      phone: '',
      notes: '',
      website: '',
    })
    assert.equal(result.ok, false)
    assert.deepEqual(result.errors, ['name', 'email'])
  })

  it('accepts a valid name and email with blank phone', () => {
    const result = validateBookingDetails({
      name: 'Sara Ali',
      email: 'sara@example.com',
      phone: '',
      notes: 'hello',
      website: '',
    })
    assert.equal(result.ok, true)
  })

  it('rejects an invalid optional phone', () => {
    const result = validateBookingDetails({
      name: 'Sara Ali',
      email: 'sara@example.com',
      phone: 'not-a-phone',
      notes: '',
      website: '',
    })
    assert.equal(result.ok, false)
    assert.deepEqual(result.errors, ['phone'])
  })

  it('accepts a UAE mobile number', () => {
    const result = validateBookingDetails({
      name: 'Sara Ali',
      email: 'sara@example.com',
      phone: '0507566474',
      notes: '',
      website: '',
    })
    assert.equal(result.ok, true)
  })
})

describe('normalizeBookingDetails', () => {
  it('lowercases email and E.164s a UAE phone', () => {
    const out = normalizeBookingDetails({
      name: ' Sara Ali ',
      email: 'Sara@Example.COM',
      phone: '0507566474',
      notes: '  hi  ',
      website: '',
    })
    assert.equal(out.email, 'sara@example.com')
    assert.equal(out.phone, '+971507566474')
    assert.equal(out.notes, 'hi')
  })
})

describe('validateBookBody — worker', () => {
  const valid = {
    meetingTypeId: 'consultation',
    startTime: '2026-08-18T05:00:00.000Z',
    name: 'Sara Ali',
    email: 'sara@example.com',
  }

  it('accepts a complete payload', () => {
    const result = validateBookBody(valid)
    assert.equal(result.ok, true)
  })

  it('flags a filled honeypot', () => {
    const result = validateBookBody({ ...valid, website: 'https://spam.test' })
    assert.equal(result.ok, false)
    assert.equal(result.honeypot, true)
  })

  it('rejects a non-UTC start time', () => {
    const result = validateBookBody({ ...valid, startTime: '2026-08-18T09:00:00+04:00' })
    assert.equal(result.ok, false)
  })

  it('rejects a missing name', () => {
    const result = validateBookBody({ ...valid, name: 'A' })
    assert.equal(result.ok, false)
  })
})
