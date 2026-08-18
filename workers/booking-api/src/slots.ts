export type BusyBlock = {
  start: Date
  end: Date
}

export type HoursWindow = { start: string; end: string }

export type SlotInput = {
  date: string
  durationMinutes: number
  timeZone: string
  now: Date
  busy: BusyBlock[]
  workingDays: readonly string[]
  workingHours: HoursWindow
  weekendHours?: HoursWindow
  bufferMinutes: number
  minNoticeHours: number
  maxDaysAhead: number
}

const WEEKEND_DAYS = new Set(['Sat', 'Sun'])

export function hoursForDate(
  date: string,
  timeZone: string,
  workingHours: HoursWindow,
  weekendHours?: HoursWindow,
): HoursWindow {
  if (weekendHours && WEEKEND_DAYS.has(weekdayShort(date, timeZone))) return weekendHours
  return workingHours
}

const MONTH_RE = /^(\d{4})-(\d{2})$/
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_RE = /^(\d{2}):(\d{2})$/

export function isYearMonth(value: string): boolean {
  if (!MONTH_RE.test(value)) return false
  const month = Number(value.slice(5, 7))
  return month >= 1 && month <= 12
}

export function isYearMonthDay(value: string): boolean {
  const match = DATE_RE.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return false
  const utc = Date.UTC(year, month - 1, day)
  const check = new Date(utc)
  return (
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day
  )
}

export function datesInMonth(month: string): string[] {
  const match = MONTH_RE.exec(month)
  if (!match) return []
  const year = Number(match[1])
  const monthNum = Number(match[2])
  const last = new Date(Date.UTC(year, monthNum, 0)).getUTCDate()
  const days: string[] = []
  for (let day = 1; day <= last; day++) {
    days.push(`${month}-${String(day).padStart(2, '0')}`)
  }
  return days
}

export function ymdInZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function addCalendarDays(ymd: string, days: number): string {
  const match = DATE_RE.exec(ymd)
  if (!match) return ymd
  const dt = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days))
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
}

export function weekdayShort(date: string, timeZone: string): string {
  const noon = zonedLocalToUtc(date, '12:00', timeZone)
  return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(noon)
}

export function zonedLocalToUtc(date: string, time: string, timeZone: string): Date {
  const dateMatch = DATE_RE.exec(date)
  const timeMatch = TIME_RE.exec(time)
  if (!dateMatch || !timeMatch) {
    throw new Error(`Invalid zoned local datetime: ${date} ${time}`)
  }
  const year = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const day = Number(dateMatch[3])
  const hour = Number(timeMatch[1])
  const minute = Number(timeMatch[2])
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0)

  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  const asIfTz = (ms: number): number => {
    const parts = dtf.formatToParts(new Date(ms))
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? '0')
    return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  }

  const offset = asIfTz(utcGuess) - utcGuess
  let utc = utcGuess - offset
  const offset2 = asIfTz(utc) - utc
  if (offset2 !== offset) utc = utcGuess - offset2
  return new Date(utc)
}

export function overlapsBusy(
  start: Date,
  end: Date,
  busy: BusyBlock[],
  bufferMs: number,
): boolean {
  const paddedStart = start.getTime() - bufferMs
  const paddedEnd = end.getTime() + bufferMs
  return busy.some((block) => block.start.getTime() < paddedEnd && block.end.getTime() > paddedStart)
}

export function eventsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && aEnd.getTime() > bStart.getTime()
}

function isWorkingDay(date: string, timeZone: string, workingDays: readonly string[]): boolean {
  return workingDays.includes(weekdayShort(date, timeZone))
}

function isPastDay(date: string, timeZone: string, now: Date): boolean {
  return date < ymdInZone(now, timeZone)
}

function isBeyondHorizon(date: string, timeZone: string, now: Date, maxDaysAhead: number): boolean {
  const today = ymdInZone(now, timeZone)
  return date > addCalendarDays(today, maxDaysAhead)
}

export function slotsForDate(input: SlotInput): Date[] {
  const {
    date,
    durationMinutes,
    timeZone,
    now,
    busy,
    workingDays,
    workingHours,
    weekendHours,
    bufferMinutes,
    minNoticeHours,
    maxDaysAhead,
  } = input

  if (!isYearMonthDay(date)) return []
  if (!isWorkingDay(date, timeZone, workingDays)) return []
  if (isPastDay(date, timeZone, now)) return []
  if (isBeyondHorizon(date, timeZone, now, maxDaysAhead)) return []

  const hours = hoursForDate(date, timeZone, workingHours, weekendHours)
  const windowStart = zonedLocalToUtc(date, hours.start, timeZone)
  const windowEnd = zonedLocalToUtc(date, hours.end, timeZone)
  const minStart = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000)
  const durationMs = durationMinutes * 60 * 1000
  const bufferMs = bufferMinutes * 60 * 1000

  const slots: Date[] = []
  for (let t = windowStart.getTime(); t + durationMs <= windowEnd.getTime(); t += durationMs) {
    const start = new Date(t)
    const end = new Date(t + durationMs)
    if (start < minStart) continue
    if (overlapsBusy(start, end, busy, bufferMs)) continue
    slots.push(start)
  }
  return slots
}

export function openDaysForMonth(month: string, input: Omit<SlotInput, 'date'>): string[] {
  if (!isYearMonth(month)) return []
  return datesInMonth(month).filter((date) => slotsForDate({ ...input, date }).length > 0)
}

export function monthUtcRange(month: string, timeZone: string): { timeMin: Date; timeMax: Date } {
  const days = datesInMonth(month)
  const first = days[0]
  const last = days[days.length - 1]
  if (!first || !last) {
    throw new Error(`Invalid month: ${month}`)
  }
  return {
    timeMin: zonedLocalToUtc(first, '00:00', timeZone),
    timeMax: zonedLocalToUtc(addCalendarDays(last, 1), '00:00', timeZone),
  }
}

export function dayUtcRange(
  date: string,
  timeZone: string,
  workingHours: HoursWindow,
  bufferMinutes: number,
  weekendHours?: HoursWindow,
): { timeMin: Date; timeMax: Date } {
  const hours = hoursForDate(date, timeZone, workingHours, weekendHours)
  const start = zonedLocalToUtc(date, hours.start, timeZone)
  const end = zonedLocalToUtc(date, hours.end, timeZone)
  const bufferMs = bufferMinutes * 60 * 1000
  return {
    timeMin: new Date(start.getTime() - bufferMs),
    timeMax: new Date(end.getTime() + bufferMs),
  }
}
