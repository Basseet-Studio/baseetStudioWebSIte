import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateContactFields,
  buildPlaceholderEmail,
  buildWorkerPayload,
  getSubmitBlockMessage,
  getSuccessMessage,
  shouldResetForm,
  getLiveFieldHint,
} from '../src/scripts/contact-form-validation.ts';

describe('validateContactFields — UAE phone formats', () => {
  const email = 'user@example.com';

  it('accepts 0507566474', () => {
    const r = validateContactFields(email, '0507566474');
    assert.equal(r.phone.status, 'valid');
    assert.match(r.phone.e164 ?? '', /^\+971/);
  });

  it('accepts +971 50 756 6474', () => {
    const r = validateContactFields(email, '+971 50 756 6474');
    assert.equal(r.phone.status, 'valid');
  });

  it('accepts 971507566474', () => {
    const r = validateContactFields(email, '971507566474');
    assert.equal(r.phone.status, 'valid');
  });

  it('accepts 00971507566474', () => {
    const r = validateContactFields(email, '00971507566474');
    assert.equal(r.phone.status, 'valid');
  });
});

describe('validateContactFields — international', () => {
  it('accepts Egypt +20 10 1234 5678', () => {
    const r = validateContactFields('', '+20 10 1234 5678');
    assert.equal(r.phone.status, 'valid');
    assert.equal(r.canSubmit, true);
  });

  it('accepts US number', () => {
    const r = validateContactFields('', '+1 213 373 4253');
    assert.equal(r.phone.status, 'valid');
  });

  it('accepts Malaysia mobile', () => {
    const r = validateContactFields('', '+60 12 345 6789');
    assert.equal(r.phone.status, 'valid');
  });

  it('accepts Indonesia mobile', () => {
    const r = validateContactFields('', '+62 812 3456 7890');
    assert.equal(r.phone.status, 'valid');
  });

  it('accepts Australia', () => {
    const r = validateContactFields('', '+61 412 345 678');
    assert.equal(r.phone.status, 'valid');
  });

  it('accepts Japan', () => {
    const r = validateContactFields('', '+81 90 1234 5678');
    assert.equal(r.phone.status, 'valid');
  });

  it('accepts China mobile', () => {
    const r = validateContactFields('', '+86 138 0013 8000');
    assert.equal(r.phone.status, 'valid');
  });
});

describe('cross-field detection', () => {
  it('flags email in phone field', () => {
    const r = validateContactFields('', 'user@example.com');
    assert.equal(r.phone.status, 'wrongField');
    assert.equal(r.canSubmit, false);
  });

  it('flags phone-like content in email field', () => {
    const r = validateContactFields('0507566474', '');
    assert.equal(r.email.status, 'wrongField');
  });

  it('live hint for email in phone', () => {
    assert.match(getLiveFieldHint('phone', 'user@test.com') ?? '', /Email field/);
  });
});

describe('submit matrix', () => {
  const base = {
    name: 'Test User',
    email: '',
    phone: '',
    message: 'Hello world test message',
    intent: [] as string[],
    lang: 'en',
  };

  it('valid + valid → can submit, no warnings that block reset', () => {
    const v = validateContactFields('a@b.co', '+971507566474');
    assert.equal(v.canSubmit, true);
    assert.equal(shouldResetForm(v.warnings), true);
  });

  it('valid + empty → can submit', () => {
    const v = validateContactFields('a@b.co', '');
    assert.equal(v.canSubmit, true);
    assert.ok(v.warnings.includes('phone_empty'));
    const msg = getSuccessMessage(v.warnings.filter((w) => w === 'phone_empty'));
    assert.match(msg.message, /email/i);
  });

  it('valid + invalid → can submit with phone_invalid warning', () => {
    const v = validateContactFields('a@b.co', '123');
    assert.equal(v.canSubmit, true);
    assert.ok(v.warnings.includes('phone_invalid'));
    assert.equal(shouldResetForm(v.warnings), false);
  });

  it('empty + valid → can submit with placeholder email', () => {
    const v = validateContactFields('', '+971507566474');
    assert.equal(v.canSubmit, true);
    const payload = buildWorkerPayload(
      { ...base, email: '', phone: '+971507566474' },
      v,
    );
    assert.equal(payload.email_is_placeholder, true);
    assert.match(payload.email, /@hehadnoemail\.com$/);
    assert.equal(payload.phone_e164, '+971507566474');
  });

  it('invalid + valid → can submit', () => {
    const v = validateContactFields('not-an-email', '+971507566474');
    assert.equal(v.canSubmit, true);
    assert.ok(v.warnings.includes('email_invalid'));
    assert.equal(shouldResetForm(v.warnings), false);
  });

  it('invalid + empty → blocked', () => {
    const v = validateContactFields('bad', '');
    assert.equal(v.canSubmit, false);
    assert.ok(getSubmitBlockMessage(v));
  });

  it('empty + invalid → blocked', () => {
    const v = validateContactFields('', '12');
    assert.equal(v.canSubmit, false);
  });

  it('invalid + invalid → blocked', () => {
    const v = validateContactFields('bad', '12');
    assert.equal(v.canSubmit, false);
  });
});

describe('buildPlaceholderEmail', () => {
  it('uses digits from e164', () => {
    assert.equal(
      buildPlaceholderEmail('+971507566474'),
      '971507566474@hehadnoemail.com',
    );
  });
});

describe('buildWorkerPayload', () => {
  it('omits invalid phone from phone field but keeps phone_raw', () => {
    const v = validateContactFields('a@b.co', 'not-a-phone-xyz');
    const payload = buildWorkerPayload(
      {
        name: 'A',
        email: 'a@b.co',
        phone: 'not-a-phone-xyz',
        message: 'long enough message',
        intent: [],
        lang: 'en',
      },
      v,
    );
    assert.equal(payload.phone, undefined);
    assert.equal(payload.phone_raw, 'not-a-phone-xyz');
    assert.ok(payload.contact_warnings?.includes('phone_invalid'));
  });
});
