import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { availability } from '../src/config/booking.ts'
import {
  addCalendarDays,
  datesInMonth,
  isYearMonth,
  isYearMonthDay,
  openDaysForMonth,
  overlapsBusy,
  slotsForDate,
  weekdayShort,
  ymdInZone,
  zonedLocalToUtc,
} from '../workers/booking-api/src/slots.ts'

const dubai = 'Asia/Dubai'

describe('zonedLocalToUtc — Asia/Dubai (UTC+4, no DST)', () => {
  it('maps 09:00 Dubai to 05:00 UTC', () => {
    const utc = zonedLocalToUtc('2026-08-18', '09:00', dubai)
    assert.equal(utc.toISOString(), '2026-08-18T05:00:00.000Z')
  })

  it('maps 17:00 Dubai to 13:00 UTC', () => {
    const utc = zonedLocalToUtc('2026-08-18', '17:00', dubai)
    assert.equal(utc.toISOString(), '2026-08-18T13:00:00.000Z')
  })

  it('maps 22:00 Dubai to 18:00 UTC', () => {
    const utc = zonedLocalToUtc('2026-08-18', '22:00', dubai)
    assert.equal(utc.toISOString(), '2026-08-18T18:00:00.000Z')
  })
})

describe('calendar helpers', () => {
  it('accepts valid month and date strings', () => {
    assert.equal(isYearMonth('2026-08'), true)
    assert.equal(isYearMonth('2026-13'), false)
    assert.equal(isYearMonthDay('2026-08-18'), true)
    assert.equal(isYearMonthDay('2026-02-31'), false)
  })

  it('lists every day in August 2026', () => {
    const days = datesInMonth('2026-08')
    assert.equal(days.length, 31)
    assert.equal(days[0], '2026-08-01')
    assert.equal(days[30], '2026-08-31')
  })

  it('adds calendar days across month boundaries', () => {
    assert.equal(addCalendarDays('2026-08-31', 1), '2026-09-01')
  })

  it('reports English weekday shorts in agency TZ', () => {
    assert.equal(weekdayShort('2026-08-17', dubai), 'Mon')
    assert.equal(weekdayShort('2026-08-22', dubai), 'Sat')
  })
})

describe('slotsForDate', () => {
  const base = {
    durationMinutes: 30,
    timeZone: dubai,
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    workingHours: { start: '17:00', end: '22:00' },
    weekendHours: { start: '09:00', end: '22:00' },
    bufferMinutes: 15,
    minNoticeHours: 4,
    maxDaysAhead: 30,
    busy: [] as { start: Date; end: Date }[],
  }

  it('returns no weekday slots before 17:00 Dubai', () => {
    const slots = slotsForDate({
      ...base,
      date: '2026-08-18',
      now: new Date('2026-08-01T00:00:00.000Z'),
    })
    const isos = slots.map((slot) => slot.toISOString())
    assert.equal(isos.includes('2026-08-18T05:00:00.000Z'), false)
    assert.equal(slots[0]?.toISOString(), '2026-08-18T13:00:00.000Z')
  })

  it('fills 17:00–22:00 on a weekday in 30 minute steps', () => {
    const slots = slotsForDate({
      ...base,
      date: '2026-08-18',
      now: new Date('2026-08-01T00:00:00.000Z'),
    })
    assert.equal(slots[0]?.toISOString(), '2026-08-18T13:00:00.000Z')
    assert.equal(slots.at(-1)?.toISOString(), '2026-08-18T17:30:00.000Z')
    assert.equal(slots.length, 10)
  })

  it('opens Saturday from 09:00 Dubai', () => {
    const slots = slotsForDate({
      ...base,
      date: '2026-08-22',
      now: new Date('2026-08-01T00:00:00.000Z'),
    })
    assert.equal(slots[0]?.toISOString(), '2026-08-22T05:00:00.000Z')
    assert.equal(slots.at(-1)?.toISOString(), '2026-08-22T17:30:00.000Z')
    assert.ok(slots.length > 10)
  })

  it('skips a busy block plus buffer', () => {
    const slots = slotsForDate({
      ...base,
      date: '2026-08-18',
      now: new Date('2026-08-01T00:00:00.000Z'),
      busy: [
        {
          start: new Date('2026-08-18T13:00:00.000Z'),
          end: new Date('2026-08-18T13:30:00.000Z'),
        },
      ],
    })
    const isos = slots.map((slot) => slot.toISOString())
    assert.equal(isos.includes('2026-08-18T13:00:00.000Z'), false)
    assert.equal(isos.includes('2026-08-18T13:30:00.000Z'), false)
    assert.equal(isos.includes('2026-08-18T14:00:00.000Z'), true)
  })

  it('hides slots inside the minimum notice window', () => {
    const slots = slotsForDate({
      ...base,
      date: '2026-08-18',
      now: new Date('2026-08-18T12:00:00.000Z'),
    })
    const isos = slots.map((slot) => slot.toISOString())
    assert.equal(isos.includes('2026-08-18T13:00:00.000Z'), false)
    assert.equal(isos.includes('2026-08-18T16:00:00.000Z'), true)
  })

  it('returns nothing beyond maxDaysAhead', () => {
    const slots = slotsForDate({
      ...base,
      date: '2026-10-18',
      now: new Date('2026-08-18T00:00:00.000Z'),
    })
    assert.equal(slots.length, 0)
  })
})

describe('openDaysForMonth', () => {
  it('marks weekdays and weekends open when the calendar is empty', () => {
    const open = openDaysForMonth('2026-08', {
      durationMinutes: 30,
      timeZone: dubai,
      now: new Date('2026-07-01T00:00:00.000Z'),
      busy: [],
      workingDays: availability.workingDays,
      workingHours: availability.workingHours,
      weekendHours: availability.weekendHours,
      bufferMinutes: 15,
      minNoticeHours: 4,
      maxDaysAhead: 90,
    })
    assert.equal(open.includes('2026-08-17'), true)
    assert.equal(open.includes('2026-08-22'), true)
  })
})

describe('overlapsBusy', () => {
  it('treats touching ranges as overlap once buffer is applied', () => {
    const start = new Date('2026-08-18T05:30:00.000Z')
    const end = new Date('2026-08-18T06:00:00.000Z')
    const busy = [{ start: new Date('2026-08-18T05:00:00.000Z'), end: new Date('2026-08-18T05:30:00.000Z') }]
    assert.equal(overlapsBusy(start, end, busy, 15 * 60 * 1000), true)
    assert.equal(overlapsBusy(start, end, busy, 0), false)
  })
})

describe('ymdInZone', () => {
  it('keeps the Dubai calendar date for a 05:00 UTC instant', () => {
    assert.equal(ymdInZone(new Date('2026-08-18T05:00:00.000Z'), dubai), '2026-08-18')
  })
})
