import { availability, getMeetingType } from './config'
import type { Env } from './env'
import {
  deleteEvent,
  insertEvent,
  listEvents,
  mintAccessToken,
  queryFreeBusy,
  type CalendarEvent,
} from './google'
import {
  dayUtcRange,
  eventsOverlap,
  monthUtcRange,
  openDaysForMonth,
  slotsForDate,
  ymdInZone,
} from './slots'
import type { BookPayload } from './validate'

export function agencyTimeZone(env: Env): string {
  return env.AGENCY_TIMEZONE || 'Asia/Dubai'
}

export async function monthAvailability(
  env: Env,
  month: string,
  meetingTypeId: string,
  now = new Date(),
): Promise<{ openDays: string[] }> {
  const meetingType = getMeetingType(meetingTypeId)
  if (!meetingType) throw new Error('unknown_meeting_type')
  const timeZone = agencyTimeZone(env)
  const range = monthUtcRange(month, timeZone)
  const token = await mintAccessToken(env)
  const busy = await queryFreeBusy(env, token, range.timeMin, range.timeMax)
  const openDays = openDaysForMonth(month, {
    durationMinutes: meetingType.durationMinutes,
    timeZone,
    now,
    busy,
    workingDays: availability.workingDays,
    workingHours: availability.workingHours,
    bufferMinutes: availability.bufferMinutes,
    minNoticeHours: availability.minNoticeHours,
    maxDaysAhead: availability.maxDaysAhead,
  })
  return { openDays }
}

export async function dateAvailability(
  env: Env,
  date: string,
  meetingTypeId: string,
  now = new Date(),
): Promise<{ slots: string[] }> {
  const meetingType = getMeetingType(meetingTypeId)
  if (!meetingType) throw new Error('unknown_meeting_type')
  const timeZone = agencyTimeZone(env)
  const range = dayUtcRange(date, timeZone, availability.workingHours, availability.bufferMinutes)
  const token = await mintAccessToken(env)
  const busy = await queryFreeBusy(env, token, range.timeMin, range.timeMax)
  const slots = slotsForDate({
    date,
    durationMinutes: meetingType.durationMinutes,
    timeZone,
    now,
    busy,
    workingDays: availability.workingDays,
    workingHours: availability.workingHours,
    bufferMinutes: availability.bufferMinutes,
    minNoticeHours: availability.minNoticeHours,
    maxDaysAhead: availability.maxDaysAhead,
  })
  return { slots: slots.map((slot) => slot.toISOString()) }
}

export class SlotTakenError extends Error {
  constructor() {
    super('That time was just booked. Pick another slot.')
    this.name = 'SlotTakenError'
  }
}

export async function executeBook(env: Env, payload: BookPayload, now = new Date()): Promise<CalendarEvent> {
  const meetingType = getMeetingType(payload.meetingTypeId)
  if (!meetingType) throw new Error('unknown_meeting_type')

  const start = new Date(payload.startTime)
  const end = new Date(start.getTime() + meetingType.durationMinutes * 60 * 1000)
  const timeZone = agencyTimeZone(env)

  const date = ymdInZone(start, timeZone)
  const grid = slotsForDate({
    date,
    durationMinutes: meetingType.durationMinutes,
    timeZone,
    now,
    busy: [],
    workingDays: availability.workingDays,
    workingHours: availability.workingHours,
    bufferMinutes: availability.bufferMinutes,
    minNoticeHours: availability.minNoticeHours,
    maxDaysAhead: availability.maxDaysAhead,
  })
  const startMs = start.getTime()
  if (!grid.some((slot) => slot.getTime() === startMs)) {
    throw new Error('invalid_slot')
  }

  const token = await mintAccessToken(env)
  const bufferMs = availability.bufferMinutes * 60 * 1000
  const busy = await queryFreeBusy(
    env,
    token,
    new Date(start.getTime() - bufferMs),
    new Date(end.getTime() + bufferMs),
  )
  const stillFree = slotsForDate({
    date,
    durationMinutes: meetingType.durationMinutes,
    timeZone,
    now,
    busy,
    workingDays: availability.workingDays,
    workingHours: availability.workingHours,
    bufferMinutes: availability.bufferMinutes,
    minNoticeHours: availability.minNoticeHours,
    maxDaysAhead: availability.maxDaysAhead,
  }).some((slot) => slot.getTime() === startMs)

  if (!stillFree) throw new SlotTakenError()

  const descriptionParts = [
    payload.phone ? `Phone: ${payload.phone}` : '',
    payload.notes ? payload.notes : '',
  ].filter(Boolean)

  const created = await insertEvent(env, token, {
    summary: `${meetingType.label} — ${payload.name}`,
    description: descriptionParts.join('\n\n'),
    start,
    end,
    attendeeEmail: payload.email,
    virtual: meetingType.virtual,
  })

  const listed = await listEvents(
    env,
    token,
    new Date(start.getTime() - bufferMs),
    new Date(end.getTime() + bufferMs),
  )
  const conflict = listed.some(
    (event) => event.id !== created.id && eventsOverlap(start, end, event.start, event.end),
  )
  if (conflict) {
    await deleteEvent(env, token, created.id)
    throw new SlotTakenError()
  }

  return created
}
