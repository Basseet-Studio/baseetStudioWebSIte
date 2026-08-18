// contact-form.ts — client-side submit handler for ContactForm.astro

import type { ContactWarning } from './contact-form-validation';

type ValidationModule = typeof import('./contact-form-validation');

let validationReady: Promise<ValidationModule> | null = null;

function loadValidation(): Promise<ValidationModule> {
  if (!validationReady) {
    validationReady = import('./contact-form-validation');
  }
  return validationReady;
}

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_LIKE = /^[\d\s()+\-.]{7,}$/;

function liveHint(field: 'email' | 'phone', value: string): string | undefined {
  const raw = value.trim();
  if (!raw) return undefined;
  if (field === 'phone' && EMAIL_LIKE.test(raw)) {
    return 'That looks like an email — did you mean the Email field?';
  }
  if (field === 'email' && PHONE_LIKE.test(raw) && !raw.includes('@')) {
    return 'That looks like a phone number — did you mean the Phone field?';
  }
  return undefined;
}

export function initContactForm(): void {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  const statusEl = document.getElementById('contact-form-status');
  const actionUrl = form?.dataset.actionUrl ?? '';

  const emailInput = form?.querySelector<HTMLInputElement>('[name="email"]');
  const phoneInput = form?.querySelector<HTMLInputElement>('[name="phone"]');
  const emailField = emailInput?.closest('.contact-form__field');
  const phoneField = phoneInput?.closest('.contact-form__field');
  const emailHint = document.getElementById('contact-email-hint');
  const phoneHint = document.getElementById('contact-phone-hint');

  if (!form || !statusEl) return;

  let lastWarnings: ContactWarning[] = [];

  function showStatus(message: string, type: string) {
    statusEl.textContent = message;
    statusEl.dataset.type = type;
    statusEl.hidden = false;
  }

  function setFieldHint(
    el: HTMLElement | null | undefined,
    field: HTMLElement | null | undefined,
    hint: string | undefined,
    state: 'ok' | 'warn' | 'error' | '',
  ) {
    if (el) el.textContent = hint ?? '';
    if (field) {
      if (state) field.dataset.fieldState = state;
      else delete field.dataset.fieldState;
    }
  }

  function applyWarningHighlights(warnings: ContactWarning[]) {
    const emailWarn =
      warnings.includes('email_invalid') ||
      (warnings.includes('email_empty') && warnings.includes('phone_invalid'));
    const phoneWarn =
      warnings.includes('phone_invalid') ||
      (warnings.includes('phone_empty') && warnings.includes('email_invalid'));

    if (emailWarn) setFieldHint(emailHint, emailField, undefined, 'warn');
    if (phoneWarn) setFieldHint(phoneHint, phoneField, undefined, 'warn');
  }

  const onLiveInput = debounce((field: 'email' | 'phone') => {
    const input = field === 'email' ? emailInput : phoneInput;
    const hintEl = field === 'email' ? emailHint : phoneHint;
    const fieldEl = field === 'email' ? emailField : phoneField;
    const hint = liveHint(field, input?.value ?? '');
    if (hint) {
      setFieldHint(hintEl, fieldEl, hint, 'error');
    } else if (!lastWarnings.length) {
      setFieldHint(hintEl, fieldEl, undefined, '');
    }
  }, 400);

  emailInput?.addEventListener('input', () => onLiveInput('email'));
  phoneInput?.addEventListener('input', () => onLiveInput('phone'));

  emailInput?.addEventListener('focus', () => { void loadValidation(); });
  phoneInput?.addEventListener('focus', () => { void loadValidation(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const mod = await loadValidation();
    const {
      validateContactFields: validate,
      buildWorkerPayload: buildPayload,
      getSubmitBlockMessage: blockMsg,
      getSuccessMessage: successMsg,
      shouldResetForm: canReset,
      getFieldState: fieldState,
    } = mod;

    const intentEls = form.querySelectorAll<HTMLInputElement>('input[name="intent"]:checked');
    const intent = Array.from(intentEls).map((el) => el.value);

    const raw = {
      name: form.querySelector<HTMLInputElement>('[name="name"]')?.value.trim() ?? '',
      email: emailInput?.value.trim() ?? '',
      phone: phoneInput?.value.trim() ?? '',
      subject: form.querySelector<HTMLInputElement>('[name="subject"]')?.value.trim() ?? '',
      message: form.querySelector<HTMLTextAreaElement>('[name="message"]')?.value.trim() ?? '',
      intent,
      lang: document.body.dataset.lang || 'en',
      page: window.location.pathname || 'Unknown',
    };

    if (!raw.name || raw.name.length < 2) {
      showStatus('Please enter your name.', 'error');
      return;
    }

    if (!raw.message || raw.message.length < 10) {
      showStatus('Message must be at least 10 characters.', 'error');
      return;
    }

    const validation = validate(raw.email, raw.phone);
    lastWarnings = validation.warnings;

    setFieldHint(
      emailHint,
      emailField,
      validation.email.hint,
      fieldState(validation.email, validation.warnings.includes('email_invalid')),
    );
    setFieldHint(
      phoneHint,
      phoneField,
      validation.phone.hint,
      fieldState(validation.phone, validation.warnings.includes('phone_invalid')),
    );

    if (!validation.canSubmit) {
      showStatus(blockMsg(validation) ?? 'Please enter a valid email or phone number.', 'error');
      return;
    }

    if (!actionUrl) {
      showStatus(
        'Form endpoint not configured. Please email us directly at baseet.socials@gmail.com.',
        'error',
      );
      return;
    }

    const formData = buildPayload(raw, validation);
    showStatus('Sending…', 'pending');

    try {
      const response = await fetch(actionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        const activeWarnings = formData.contact_warnings ?? [];
        const { message, type } = successMsg(activeWarnings);
        showStatus(message, type);

        if (canReset(activeWarnings)) {
          form.reset();
          lastWarnings = [];
          setFieldHint(emailHint, emailField, undefined, '');
          setFieldHint(phoneHint, phoneField, undefined, '');
        } else {
          applyWarningHighlights(activeWarnings);
        }
      } else {
        let errBody: { error?: string } | null = null;
        try {
          errBody = await response.json();
        } catch {
          /* not JSON */
        }
        showStatus(
          errBody?.error ?? `Worker returned ${response.status}. Please try again or email us directly.`,
          'error',
        );
      }
    } catch (err) {
      const name = err instanceof Error ? err.name : 'Error';
      const message = err instanceof Error ? err.message : String(err);
      if (name === 'TimeoutError') {
        showStatus('Request timed out. Please try again or email us directly.', 'error');
      } else if (name === 'AbortError') {
        showStatus('Request cancelled.', 'error');
      } else {
        showStatus(
          `Unable to reach form worker (${name}). Please email us directly at baseet.socials@gmail.com.`,
          'error',
        );
      }
      console.error('[ContactForm] Network/fetch failure:', name, message, err);
    }
  });
}

export function destroyContactForm(): void {
  /* listeners are tied to page lifetime; astro:before-swap replaces the DOM */
}
