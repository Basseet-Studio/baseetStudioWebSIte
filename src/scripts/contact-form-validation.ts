// contact-form-validation.ts
// Smart email/phone validation for the contact form. At least one valid channel
// is required to submit; invalid optional fields become warnings, not blockers.

import parsePhoneNumberFromString, {
  parsePhoneNumberWithError,
  type CountryCode,
  type PhoneNumber,
} from 'libphonenumber-js/max';

export type FieldStatus =
  | 'empty'
  | 'valid'
  | 'invalid'
  | 'wrongField'
  | 'unsupportedRegion';

export type ContactWarning =
  | 'email_invalid'
  | 'phone_invalid'
  | 'email_empty'
  | 'phone_empty';

export type FieldResult = {
  status: FieldStatus;
  hint?: string;
  e164?: string;
};

export type ContactValidation = {
  email: FieldResult;
  phone: FieldResult;
  canSubmit: boolean;
  warnings: ContactWarning[];
};

export type ContactPayloadExtras = {
  email_is_placeholder?: boolean;
  contact_warnings?: ContactWarning[];
  phone_e164?: string;
  phone_raw?: string;
};

const PLACEHOLDER_EMAIL_DOMAIN = 'hehadnoemail.com';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Looks like an email typed into the phone field */
const EMAIL_LIKE_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mostly digits with optional +, spaces, dashes, parens */
const PHONE_LIKE_PATTERN = /^[\d\s()+\-.]{7,}$/;

const SUPPORTED_COUNTRIES = new Set<CountryCode>([
  // GCC + Egypt + common Arab markets
  'AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'EG', 'JO', 'LB', 'MA', 'TN', 'DZ',
  // Southeast Asia
  'MY', 'ID',
  // Americas
  'US', 'CA',
  // Europe (common)
  'GB', 'IE', 'DE', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'SE', 'NO', 'DK',
  'FI', 'PL', 'CH', 'AT', 'GR', 'CZ', 'RO', 'HU', 'SK', 'BG', 'HR', 'SI',
  'LT', 'LV', 'EE', 'LU', 'MT', 'CY', 'IS',
  // ANZ + East Asia
  'AU', 'NZ', 'JP', 'CN', 'HK', 'SG', 'KR', 'TW',
]);

/** Default-country candidates for national-format numbers (UAE first). */
const DEFAULT_COUNTRY_CANDIDATES: CountryCode[] = [
  'AE', 'EG', 'SA', 'QA', 'KW', 'BH', 'OM', 'MY', 'ID', 'US', 'CA', 'GB',
  'AU', 'NZ', 'JP', 'CN', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'PL',
];

function trim(value: string | undefined | null): string {
  return (value ?? '').trim();
}

function parseErrorHint(message: string): string {
  if (message.includes('TOO_SHORT')) return 'Looks like a digit is missing.';
  if (message.includes('TOO_LONG')) return 'That number seems too long.';
  if (message.includes('NOT_A_NUMBER')) return "That doesn't look like a phone number.";
  if (message.includes('INVALID_COUNTRY')) return "We can't read that country code.";
  return 'That number does not look right.';
}

function tryParsePhone(raw: string, defaultCountry?: CountryCode): PhoneNumber | undefined {
  const options = { defaultCountry, extract: false as const };
  try {
    return parsePhoneNumberWithError(raw, options);
  } catch {
    return parsePhoneNumberFromString(raw, options);
  }
}

function parsePhone(rawInput: string): FieldResult {
  const raw = trim(rawInput);
  if (!raw) return { status: 'empty' };

  if (EMAIL_LIKE_PATTERN.test(raw)) {
    return {
      status: 'wrongField',
      hint: 'That looks like an email — did you mean the Email field?',
    };
  }

  const normalized = raw.replace(/[\s\-().]/g, '');

  let parsed: PhoneNumber | undefined;

  if (/^(\+|00)/.test(normalized) || /^[1-9]\d{6,}$/.test(normalized)) {
    const intl = normalized.startsWith('00') ? `+${normalized.slice(2)}` : normalized;
    parsed = tryParsePhone(intl.startsWith('+') ? intl : `+${intl}`);
  }

  if (!parsed) {
    for (const country of DEFAULT_COUNTRY_CANDIDATES) {
      const candidate = tryParsePhone(raw, country);
      if (candidate?.isValid()) {
        parsed = candidate;
        break;
      }
    }
  }

  if (!parsed) {
    try {
      parsePhoneNumberWithError(raw, { extract: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { status: 'invalid', hint: parseErrorHint(message) };
    }
    return { status: 'invalid', hint: 'That number does not look right.' };
  }

  if (!parsed.isValid()) {
    return { status: 'invalid', hint: 'That number does not look right.' };
  }

  const country = parsed.country;
  if (country && !SUPPORTED_COUNTRIES.has(country)) {
    return {
      status: 'unsupportedRegion',
      hint: "We can't verify that country code yet — try email or an international format (+country code).",
      e164: parsed.number,
    };
  }

  return { status: 'valid', e164: parsed.number };
}

function parseEmail(rawInput: string): FieldResult {
  const raw = trim(rawInput);
  if (!raw) return { status: 'empty' };

  const digitsOnly = raw.replace(/\D/g, '');
  if (PHONE_LIKE_PATTERN.test(raw) && !raw.includes('@') && digitsOnly.length >= 7) {
    return {
      status: 'wrongField',
      hint: 'That looks like a phone number — did you mean the Phone field?',
    };
  }

  if (!EMAIL_PATTERN.test(raw)) {
    return { status: 'invalid', hint: 'Check for a typo in your email address.' };
  }

  return { status: 'valid' };
}

function collectWarnings(email: FieldResult, phone: FieldResult): ContactWarning[] {
  const warnings: ContactWarning[] = [];

  if (email.status === 'empty') warnings.push('email_empty');
  else if (email.status !== 'valid') warnings.push('email_invalid');

  if (phone.status === 'empty') warnings.push('phone_empty');
  else if (phone.status !== 'valid') warnings.push('phone_invalid');

  return warnings;
}

export function validateContactFields(
  emailInput: string | undefined | null,
  phoneInput: string | undefined | null,
): ContactValidation {
  const email = parseEmail(emailInput ?? '');
  const phone = parsePhone(phoneInput ?? '');

  const emailOk = email.status === 'valid';
  const phoneOk = phone.status === 'valid';
  const canSubmit = emailOk || phoneOk;

  const warnings = collectWarnings(email, phone);

  return { email, phone, canSubmit, warnings };
}

export function buildPlaceholderEmail(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  return `${digits}@${PLACEHOLDER_EMAIL_DOMAIN}`;
}

export type WorkerContactPayload = {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  intent: string[];
  lang: string;
} & ContactPayloadExtras;

export function buildWorkerPayload(
  base: {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
    intent: string[];
    lang: string;
  },
  validation: ContactValidation,
): WorkerContactPayload {
  const extras: ContactPayloadExtras = {};
  const emailOk = validation.email.status === 'valid';
  const phoneOk = validation.phone.status === 'valid';

  let email = trim(base.email);
  let phone = trim(base.phone);

  if (phoneOk && validation.phone.e164) {
    extras.phone_e164 = validation.phone.e164;
    phone = validation.phone.e164;
  } else if (phone && validation.phone.status !== 'valid') {
    extras.phone_raw = phone;
    phone = undefined;
  }

  if (!emailOk && phoneOk && validation.phone.e164) {
    email = buildPlaceholderEmail(validation.phone.e164);
    extras.email_is_placeholder = true;
  }

  const activeWarnings = validation.warnings.filter((w) => {
    if (w === 'email_empty' && extras.email_is_placeholder) return true;
    if (w === 'phone_empty' && emailOk) return true;
    if (w === 'email_invalid' && phoneOk) return true;
    if (w === 'phone_invalid' && emailOk) return true;
    return false;
  });

  if (activeWarnings.length) extras.contact_warnings = activeWarnings;

  return {
    ...base,
    email,
    phone: phone || undefined,
    ...extras,
  };
}

export function getSubmitBlockMessage(validation: ContactValidation): string | null {
  if (validation.canSubmit) return null;

  const { email, phone } = validation;

  if (email.status === 'wrongField') return email.hint ?? 'Check the email field.';
  if (phone.status === 'wrongField') return phone.hint ?? 'Check the phone field.';

  if (email.status === 'unsupportedRegion' || phone.status === 'unsupportedRegion') {
    return phone.hint ?? email.hint ?? 'Please use a supported phone format or email.';
  }

  if (email.status !== 'empty' && email.status !== 'valid' && phone.status !== 'valid') {
    if (email.hint) return email.hint;
    if (phone.hint) return phone.hint;
    return 'Please enter a valid email or phone number so we can reach you.';
  }

  return 'Please enter a valid email or phone number so we can reach you.';
}

export function getSuccessMessage(warnings: ContactWarning[]): {
  message: string;
  type: 'success' | 'success-warn';
} {
  const has = (w: ContactWarning) => warnings.includes(w);

  if (!warnings.length) {
    return { message: 'Thank you! Your message has been sent.', type: 'success' };
  }

  if (has('phone_invalid') && !has('email_invalid') && !has('email_empty')) {
    return {
      message: "Sent by email. That number didn't look right — tweak it and send again.",
      type: 'success-warn',
    };
  }

  if (has('email_invalid') && !has('phone_invalid') && !has('phone_empty')) {
    return {
      message: "Sent by phone. That email didn't look right — tweak it and send again.",
      type: 'success-warn',
    };
  }

  if (has('phone_empty') && !has('email_invalid')) {
    return {
      message: "Sent — we'll reply by email. Drop a number if you want a faster call back.",
      type: 'success-warn',
    };
  }

  if (has('email_empty') && !has('phone_invalid')) {
    return {
      message: "Sent — we'll call your number. An email helps us keep everything in one thread.",
      type: 'success-warn',
    };
  }

  return {
    message: 'Thank you! Your message has been sent.',
    type: 'success-warn',
  };
}

export function getFieldState(
  field: FieldResult,
  isWarningContext: boolean,
): 'ok' | 'warn' | 'error' | '' {
  if (field.status === 'valid' || field.status === 'empty') {
    return isWarningContext ? 'warn' : '';
  }
  if (field.status === 'wrongField' || field.status === 'invalid' || field.status === 'unsupportedRegion') {
    return 'error';
  }
  return '';
}

export function shouldResetForm(warnings: ContactWarning[]): boolean {
  const blockingWarnings = warnings.filter(
    (w) => w === 'email_invalid' || w === 'phone_invalid',
  );
  return blockingWarnings.length === 0;
}

/** Lightweight cross-field hint for live input (no lib re-parse on every key). */
export function getLiveFieldHint(
  field: 'email' | 'phone',
  value: string,
): string | undefined {
  const raw = trim(value);
  if (!raw) return undefined;

  if (field === 'phone' && EMAIL_LIKE_PATTERN.test(raw)) {
    return 'That looks like an email — did you mean the Email field?';
  }

  if (field === 'email' && PHONE_LIKE_PATTERN.test(raw) && !raw.includes('@')) {
    return 'That looks like a phone number — did you mean the Phone field?';
  }

  return undefined;
}
