const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+?[0-9\s().-]{7,20}$/
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/

export type BookPayload = {
  meetingTypeId: string
  startTime: string
  name: string
  email: string
  phone?: string
  notes?: string
}

export type ValidateResult =
  | { ok: true; value: BookPayload; honeypot: boolean }
  | { ok: false; message: string; honeypot: boolean }

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function validateBookBody(raw: unknown): ValidateResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, message: 'Request body must be a JSON object.', honeypot: false }
  }
  const body = raw as Record<string, unknown>
  const honeypot = asString(body.website).length > 0

  const meetingTypeId = asString(body.meetingTypeId)
  const startTime = asString(body.startTime)
  const name = asString(body.name)
  const email = asString(body.email).toLowerCase()
  const phone = asString(body.phone)
  const notes = asString(body.notes)

  if (honeypot) {
    return { ok: false, message: 'Invalid request.', honeypot: true }
  }

  if (!meetingTypeId) {
    return { ok: false, message: 'Choose a meeting type.', honeypot: false }
  }
  if (!ISO_RE.test(startTime) || Number.isNaN(Date.parse(startTime))) {
    return { ok: false, message: 'Start time must be a UTC ISO 8601 timestamp.', honeypot: false }
  }
  if (name.length < 2 || name.length > 120) {
    return { ok: false, message: 'Enter your name.', honeypot: false }
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, message: 'Enter a valid email address.', honeypot: false }
  }
  if (phone && !PHONE_RE.test(phone)) {
    return { ok: false, message: 'Enter a valid phone number, or leave it blank.', honeypot: false }
  }
  if (notes.length > 2000) {
    return { ok: false, message: 'Notes are too long.', honeypot: false }
  }

  return {
    ok: true,
    honeypot: false,
    value: {
      meetingTypeId,
      startTime,
      name,
      email,
      phone: phone || undefined,
      notes: notes || undefined,
    },
  }
}
