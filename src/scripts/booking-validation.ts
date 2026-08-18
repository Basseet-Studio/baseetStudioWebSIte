import parsePhoneNumberFromString from 'libphonenumber-js/max'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export type BookingFieldError = 'name' | 'email' | 'phone'

export type BookingDetails = {
  name: string
  email: string
  phone: string
  notes: string
  website: string
}

export type BookingValidation = {
  ok: boolean
  errors: BookingFieldError[]
}

function trim(value: string | undefined | null): string {
  return (value ?? '').trim()
}

export function validateBookingDetails(input: BookingDetails): BookingValidation {
  const errors: BookingFieldError[] = []
  const name = trim(input.name)
  const email = trim(input.email)
  const phone = trim(input.phone)

  if (name.length < 2 || name.length > 120) errors.push('name')
  if (!EMAIL_RE.test(email) || email.length > 254) errors.push('email')
  if (phone) {
    const parsed = parsePhoneNumberFromString(phone, 'AE')
    if (!parsed?.isValid()) errors.push('phone')
  }

  return { ok: errors.length === 0, errors }
}

export function normalizeBookingDetails(input: BookingDetails): Omit<BookingDetails, 'website'> {
  const phone = trim(input.phone)
  const parsed = phone ? parsePhoneNumberFromString(phone, 'AE') : undefined
  return {
    name: trim(input.name),
    email: trim(input.email).toLowerCase(),
    phone: parsed?.isValid() ? parsed.number : phone,
    notes: trim(input.notes),
  }
}
