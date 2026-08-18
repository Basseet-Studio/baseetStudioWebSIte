import { dateAvailability, executeBook, monthAvailability, SlotTakenError } from './booking'
import type { Env } from './env'
import { GoogleError } from './google'
import { corsHeaders, json, jsonError, preflight } from './http'
import { consumeBookLimit } from './rate-limit'
import { isYearMonth, isYearMonthDay } from './slots'
import { getMeetingType } from './config'
import { validateBookBody, type BookPayload } from './validate'

export class BookingLock {
  constructor(
    readonly ctx: DurableObjectState,
    readonly env: Env,
  ) {}

  async fetch(request: Request): Promise<Response> {
    let payload: BookPayload
    try {
      payload = (await request.json()) as BookPayload
    } catch {
      return jsonError(request, 400, 'validation', 'Request body must be JSON.')
    }

    try {
      const event = await executeBook(this.env, payload)
      return json(request, { event }, 201)
    } catch (err) {
      if (err instanceof SlotTakenError) {
        return jsonError(request, 409, 'slot_taken', err.message)
      }
      if (err instanceof Error && err.message === 'unknown_meeting_type') {
        return jsonError(request, 400, 'validation', 'Unknown meeting type.')
      }
      if (err instanceof Error && err.message === 'invalid_slot') {
        return jsonError(request, 400, 'validation', 'That time is not an available slot.')
      }
      if (err instanceof GoogleError) {
        return jsonError(request, 502, 'google_failure', err.message)
      }
      return jsonError(request, 502, 'google_failure', 'Booking failed. Please try another time.')
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return preflight(request)

    const url = new URL(request.url)

    try {
      if (url.pathname === '/availability' && request.method === 'GET') {
        return await handleAvailability(request, env, url)
      }
      if (url.pathname === '/book' && request.method === 'POST') {
        return await handleBook(request, env)
      }
      return jsonError(request, 404, 'not_found', 'Unknown endpoint.')
    } catch (err) {
      if (err instanceof GoogleError) {
        return jsonError(request, 502, 'google_failure', err.message)
      }
      console.error('[booking-api]', err)
      return jsonError(request, 502, 'google_failure', 'Something went wrong talking to the calendar.')
    }
  },
}

async function handleAvailability(request: Request, env: Env, url: URL): Promise<Response> {
  const meetingType = url.searchParams.get('meetingType') ?? ''
  if (!getMeetingType(meetingType)) {
    return jsonError(request, 400, 'validation', 'Unknown or missing meetingType.')
  }

  const month = url.searchParams.get('month')
  const date = url.searchParams.get('date')

  if (month) {
    if (!isYearMonth(month)) {
      return jsonError(request, 400, 'validation', 'month must be YYYY-MM.')
    }
    const result = await monthAvailability(env, month, meetingType)
    return json(request, result)
  }

  if (date) {
    if (!isYearMonthDay(date)) {
      return jsonError(request, 400, 'validation', 'date must be YYYY-MM-DD.')
    }
    const result = await dateAvailability(env, date, meetingType)
    return json(request, result)
  }

  return jsonError(request, 400, 'validation', 'Provide month=YYYY-MM or date=YYYY-MM-DD.')
}

async function handleBook(request: Request, env: Env): Promise<Response> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return jsonError(request, 400, 'validation', 'Request body must be JSON.')
  }

  const limited = await consumeBookLimit(env, request)
  if (limited === 'limited') {
    return jsonError(request, 429, 'rate_limit', 'Too many booking attempts. Try again in an hour.')
  }

  const parsed = validateBookBody(raw)
  if (!parsed.ok) {
    return jsonError(request, 400, 'validation', parsed.message)
  }

  const id = env.BOOKING_LOCK.idFromName('global')
  const stub = env.BOOKING_LOCK.get(id)
  const locked = await stub.fetch(new Request('https://booking-lock/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.value),
  }))

  const body = await locked.text()
  return new Response(body, {
    status: locked.status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request),
    },
  })
}
