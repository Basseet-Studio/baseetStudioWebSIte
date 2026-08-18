import type { Env } from './env'
import type { BusyBlock } from './slots'

export class GoogleError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
  ) {
    super(message)
    this.name = 'GoogleError'
  }
}

export async function mintAccessToken(env: Env): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new GoogleError('Could not refresh the Google Calendar token.', 502)
  }
  const token = (body as { access_token?: string } | null)?.access_token
  if (!token) {
    throw new GoogleError('Google token response was missing access_token.', 502)
  }
  return token
}

async function calendarFetch(
  token: string,
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })
}

export function calendarId(env: Env): string {
  let id = env.GOOGLE_CALENDAR_ID?.trim() ?? ''
  if (
    (id.startsWith('"') && id.endsWith('"')) ||
    (id.startsWith("'") && id.endsWith("'"))
  ) {
    id = id.slice(1, -1).trim()
  }
  return id.includes('@') ? id.toLowerCase() : id
}

type CalendarBusy = {
  busy?: Array<{ start: string; end: string }>
  errors?: Array<{ reason?: string; message?: string }>
}

function pickCalendar(
  calendars: Record<string, CalendarBusy> | undefined,
  id: string,
): CalendarBusy | undefined {
  if (!calendars) return undefined
  if (calendars[id]) return calendars[id]
  const match = Object.entries(calendars).find(([key]) => key.toLowerCase() === id.toLowerCase())
  return match?.[1]
}

export async function queryFreeBusy(
  env: Env,
  token: string,
  timeMin: Date,
  timeMax: Date,
): Promise<BusyBlock[]> {
  const id = calendarId(env)
  const response = await calendarFetch(token, 'https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: 'UTC',
      items: [{ id }],
    }),
  })
  const body = (await response.json().catch(() => null)) as {
    calendars?: Record<string, CalendarBusy>
    error?: { message?: string }
  } | null

  if (!response.ok) {
    throw new GoogleError(body?.error?.message ?? 'Google Calendar free/busy lookup failed.', 502)
  }

  const calendar = pickCalendar(body?.calendars, id)
  const reason = calendar?.errors?.[0]?.reason || calendar?.errors?.[0]?.message
  if (reason) {
    console.error('[booking-api] freeBusy calendar error', reason)
    throw new GoogleError(
      reason === 'notFound'
        ? 'Google Calendar was not found. Check GOOGLE_CALENDAR_ID matches the connected Google account.'
        : 'Google Calendar free/busy returned an error for this calendar.',
      502,
    )
  }

  return (calendar?.busy ?? []).map((block) => ({
    start: new Date(block.start),
    end: new Date(block.end),
  }))
}

export type InsertEventInput = {
  summary: string
  description: string
  start: Date
  end: Date
  attendeeEmail: string
  virtual: boolean
}

export type CalendarEvent = {
  id: string
  htmlLink?: string
  hangoutLink?: string
  meetUrl?: string
  summary: string
  start: string
  end: string
}

type GoogleEvent = {
  id?: string
  htmlLink?: string
  hangoutLink?: string
  summary?: string
  start?: { dateTime?: string }
  end?: { dateTime?: string }
  status?: string
  conferenceData?: { entryPoints?: Array<{ entryPointType?: string; uri?: string }> }
}

function meetUrlFromEvent(event: GoogleEvent): string | undefined {
  const entry = event.conferenceData?.entryPoints?.find((item) => item.entryPointType === 'video')
  return entry?.uri ?? event.hangoutLink
}

function toCalendarEvent(event: GoogleEvent): CalendarEvent {
  const id = event.id
  if (!id) throw new GoogleError('Google Calendar did not return an event id.', 502)
  return {
    id,
    htmlLink: event.htmlLink,
    hangoutLink: event.hangoutLink,
    meetUrl: meetUrlFromEvent(event),
    summary: event.summary ?? '',
    start: event.start?.dateTime ?? '',
    end: event.end?.dateTime ?? '',
  }
}

export async function insertEvent(
  env: Env,
  token: string,
  input: InsertEventInput,
): Promise<CalendarEvent> {
  const id = calendarId(env)
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events?conferenceDataVersion=1&sendUpdates=all`
  const body: Record<string, unknown> = {
    summary: input.summary,
    description: input.description,
    start: { dateTime: input.start.toISOString(), timeZone: 'UTC' },
    end: { dateTime: input.end.toISOString(), timeZone: 'UTC' },
    attendees: [{ email: id }, { email: input.attendeeEmail }],
    guestsCanModify: false,
  }
  if (input.virtual) {
    body.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    }
  }

  const response = await calendarFetch(token, url, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  const event = (await response.json().catch(() => null)) as GoogleEvent & { error?: { message?: string } } | null
  if (!response.ok || !event || event.error) {
    throw new GoogleError(event?.error?.message ?? 'Could not create the calendar event.', 502)
  }
  return toCalendarEvent(event)
}

export async function listEvents(
  env: Env,
  token: string,
  timeMin: Date,
  timeMax: Date,
): Promise<Array<{ id: string; start: Date; end: Date }>> {
  const encodedCalendarId = encodeURIComponent(calendarId(env))
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
  })
  const response = await calendarFetch(
    token,
    `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events?${params}`,
  )
  const body = (await response.json().catch(() => null)) as {
    items?: GoogleEvent[]
    error?: { message?: string }
  } | null
  if (!response.ok) {
    throw new GoogleError(body?.error?.message ?? 'Could not list calendar events.', 502)
  }
  return (body?.items ?? [])
    .filter((item) => item.id && item.status !== 'cancelled' && item.start?.dateTime && item.end?.dateTime)
    .map((item) => ({
      id: item.id as string,
      start: new Date(item.start!.dateTime!),
      end: new Date(item.end!.dateTime!),
    }))
}

export async function deleteEvent(env: Env, token: string, eventId: string): Promise<void> {
  const encodedCalendarId = encodeURIComponent(calendarId(env))
  const encodedEvent = encodeURIComponent(eventId)
  const response = await calendarFetch(
    token,
    `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events/${encodedEvent}?sendUpdates=all`,
    { method: 'DELETE' },
  )
  if (!response.ok && response.status !== 404) {
    throw new GoogleError('Could not roll back a conflicting calendar event.', 502)
  }
}
