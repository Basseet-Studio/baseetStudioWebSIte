import { validateBookingDetails, normalizeBookingDetails } from './booking-validation'

type Copy = {
  timezone: string
  slotsEmpty: string
  slotsLoading: string
  calendarLoading: string
  noMonthDays: string
  pickDay: string
  more: string
  less: string
  submitting: string
  confirm: string
  successTitle: string
  successLead: string
  errorGeneric: string
  errorSlotTaken: string
  errorRateLimit: string
  errorNetwork: string
  errorName: string
  errorEmail: string
  errorPhone: string
  monthPrev: string
  monthNext: string
}

type BookedEvent = {
  id?: string
  summary?: string
  start: string
  end: string
  meetUrl?: string
  hangoutLink?: string
}

type WidgetState = {
  typeId: string
  month: string
  openDays: Set<string>
  date: string | null
  slots: string[]
  slot: string | null
  loadingMonth: boolean
  loadingSlots: boolean
  monthFailed: boolean
}

let pageAbort: AbortController | null = null

export function destroyBookingWidget(): void {
  pageAbort?.abort()
  pageAbort = null
}

export function initBookingWidget(): void {
  destroyBookingWidget()
  const root = document.querySelector<HTMLElement>('[data-booking-root]')
  if (!root) return

  const apiUrl = root.dataset.apiUrl?.replace(/\/$/, '') ?? ''
  const lang = root.dataset.lang || 'en'
  const maxDaysAhead = Number(root.dataset.maxDaysAhead || '30')
  const copy = readCopy(root)
  if (!apiUrl || !copy) return

  pageAbort = new AbortController()
  const { signal } = pageAbort
  const visitorTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

  const calendarEl = root.querySelector<HTMLElement>('[data-booking-calendar]')
  const weekdayEl = root.querySelector<HTMLElement>('[data-booking-weekdays]')
  const monthLabel = root.querySelector<HTMLElement>('[data-booking-month-label]')
  const slotsEl = root.querySelector<HTMLElement>('[data-booking-slots]')
  const tzEl = root.querySelector<HTMLElement>('[data-booking-tz]')
  const form = root.querySelector<HTMLFormElement>('[data-booking-form]')
  const details = root.querySelector<HTMLElement>('[data-booking-details]')
  const statusEl = root.querySelector<HTMLElement>('[data-booking-status]')
  const success = root.querySelector<HTMLElement>('[data-booking-success]')
  const panel = root.querySelector<HTMLElement>('[data-booking-panel]')
  const extra = root.querySelector<HTMLElement>('[data-booking-extra]')
  const extraToggle = root.querySelector<HTMLButtonElement>('[data-booking-extra-toggle]')
  const summaryEl = root.querySelector<HTMLElement>('[data-booking-summary]')
  const submitBtn = root.querySelector<HTMLButtonElement>('[data-booking-submit]')
  const icsLink = root.querySelector<HTMLAnchorElement>('[data-booking-ics]')
  const successWhen = root.querySelector<HTMLElement>('[data-booking-success-when]')
  const successLead = root.querySelector<HTMLElement>('[data-booking-success-lead]')
  const prevBtn = root.querySelector<HTMLButtonElement>('[data-booking-prev]')
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-booking-next]')

  if (!calendarEl || !weekdayEl || !monthLabel || !slotsEl || !form || !details || !statusEl || !success || !panel || !submitBtn) {
    return
  }

  const firstType = root.querySelector<HTMLInputElement>('input[name="meetingType"]:checked')
  const state: WidgetState = {
    typeId: firstType?.value || 'consultation',
    month: currentMonth(),
    openDays: new Set(),
    date: null,
    slots: [],
    slot: null,
    loadingMonth: false,
    loadingSlots: false,
    monthFailed: false,
  }

  if (tzEl) {
    tzEl.textContent = copy.timezone.replace('{tz}', timezoneLabel(visitorTz, lang))
  }

  renderWeekdays(weekdayEl, lang)

  async function loadMonth(): Promise<void> {
    state.loadingMonth = true
    state.monthFailed = false
    state.openDays = new Set()
    state.date = null
    state.slots = []
    state.slot = null
    renderCalendar()
    renderSlots()
    toggleDetails()
    calendarEl!.dataset.state = 'loading'
    try {
      const data = await getJson<{ openDays: string[] }>(
        `${apiUrl}/availability?month=${state.month}&meetingType=${encodeURIComponent(state.typeId)}`,
        signal,
      )
      state.openDays = new Set(data.openDays)
    } catch (err) {
      if (isAbort(err)) return
      state.monthFailed = true
      showStatus(messageForError(err, copy), 'error')
    } finally {
      state.loadingMonth = false
      calendarEl!.dataset.state = state.monthFailed ? 'error' : state.openDays.size ? 'ready' : 'empty'
      renderCalendar()
    }
  }

  async function loadSlots(date: string): Promise<void> {
    state.loadingSlots = true
    state.slots = []
    state.slot = null
    renderSlots()
    toggleDetails()
    try {
      const data = await getJson<{ slots: string[] }>(
        `${apiUrl}/availability?date=${date}&meetingType=${encodeURIComponent(state.typeId)}`,
        signal,
      )
      state.slots = data.slots
    } catch (err) {
      if (isAbort(err)) return
      showStatus(copy.errorNetwork, 'error')
    } finally {
      state.loadingSlots = false
      renderSlots()
    }
  }

  function renderCalendar(): void {
    const [year, month] = state.month.split('-').map(Number)
    monthLabel!.textContent = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(
      new Date(year, month - 1, 1),
    )
    if (state.loadingMonth) {
      calendarEl!.innerHTML = Array.from({ length: 35 }, () =>
        '<span class="booking__day booking__day--pad booking__day--skel" aria-hidden="true"></span>',
      ).join('')
      return
    }
    const firstDay = weekStart(lang)
    const days = daysInMonth(state.month)
    const startPad = weekdayIndex(`${state.month}-01`, firstDay)
    const today = todayYmd()
    const maxDate = addDays(today, maxDaysAhead)

    if (prevBtn) prevBtn.disabled = state.month <= today.slice(0, 7)
    if (nextBtn) nextBtn.disabled = state.month >= maxDate.slice(0, 7)

    const cells: string[] = []
    for (let i = 0; i < startPad; i++) cells.push('<span class="booking__day booking__day--pad" aria-hidden="true"></span>')
    const dayFmt = new Intl.DateTimeFormat(lang, { weekday: 'long', month: 'long', day: 'numeric' })
    for (const date of days) {
      const open = state.openDays.has(date)
      const selected = state.date === date
      const disabled = !open || date < today || date > maxDate
      const isToday = date === today
      const label = Number(date.slice(8, 10))
      const [year, month, day] = date.split('-').map(Number)
      const spoken = dayFmt.format(new Date(year, month - 1, day))
      const aria = disabled ? `${spoken}` : spoken
      cells.push(
        `<button type="button" class="booking__day${selected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}" data-date="${date}" ${disabled ? 'disabled' : ''} aria-pressed="${selected ? 'true' : 'false'}" ${isToday ? 'aria-current="date"' : ''} aria-label="${escapeHtml(aria)}">${label}</button>`,
      )
    }
    calendarEl!.innerHTML = cells.join('')
    if (!state.loadingMonth && !state.monthFailed && state.openDays.size === 0) {
      calendarEl!.insertAdjacentHTML(
        'beforeend',
        `<p class="booking__empty">${escapeHtml(copy.noMonthDays)}</p>`,
      )
    }
  }

  function renderSlots(): void {
    slotsEl!.hidden = false
    if (state.loadingSlots) {
      slotsEl!.innerHTML = Array.from({ length: 6 }, () =>
        '<span class="booking__slot booking__slot--skel" aria-hidden="true"></span>',
      ).join('')
      renderSummary()
      return
    }
    if (!state.date) {
      slotsEl!.innerHTML = `<p class="booking__hint">${escapeHtml(copy.pickDay)}</p>`
      renderSummary()
      return
    }
    if (!state.slots.length) {
      slotsEl!.innerHTML = `<p class="booking__hint">${escapeHtml(copy.slotsEmpty)}</p>`
      renderSummary()
      return
    }
    const timeFmt = new Intl.DateTimeFormat(lang, {
      timeZone: visitorTz,
      hour: 'numeric',
      minute: '2-digit',
    })
    slotsEl!.innerHTML = state.slots
      .map((iso) => {
        const selected = state.slot === iso
        return `<button type="button" class="booking__slot${selected ? ' is-selected' : ''}" data-slot="${iso}" aria-pressed="${selected ? 'true' : 'false'}">${timeFmt.format(new Date(iso))}</button>`
      })
      .join('')
    renderSummary()
  }

  function renderSummary(): void {
    if (!summaryEl) return
    if (!state.date) {
      summaryEl.hidden = true
      summaryEl.textContent = ''
      return
    }
    const typeName =
      root.querySelector<HTMLElement>('.booking__type:has(input:checked) .booking__type-name')?.textContent?.trim() || ''
    const [year, month, day] = state.date.split('-').map(Number)
    const dayLabel = new Intl.DateTimeFormat(lang, { weekday: 'long', month: 'long', day: 'numeric' }).format(
      new Date(year, month - 1, day),
    )
    let text = typeName ? `${typeName} · ${dayLabel}` : dayLabel
    if (state.slot) {
      const time = new Intl.DateTimeFormat(lang, {
        timeZone: visitorTz,
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(state.slot))
      text = `${text} · ${time}`
    }
    summaryEl.hidden = false
    summaryEl.textContent = text
  }

  function toggleDetails(): void {
    details!.hidden = !state.slot
    renderSummary()
  }

  function showStatus(message: string, type: 'error' | 'pending' | ''): void {
    statusEl!.textContent = message
    statusEl!.hidden = !message
    statusEl!.dataset.type = type
  }

  function fieldError(name: 'name' | 'email' | 'phone', on: boolean): void {
    const field = form!.querySelector(`[data-field="${name}"]`)
    if (field instanceof HTMLElement) field.dataset.invalid = on ? 'true' : 'false'
    const hint = form!.querySelector(`[data-error="${name}"]`)
    if (hint instanceof HTMLElement) {
      const message = name === 'email' ? copy.errorEmail : name === 'phone' ? copy.errorPhone : copy.errorName
      hint.textContent = on ? message : ''
    }
    const input = form!.querySelector(`[data-field="${name}"] input`)
    if (input instanceof HTMLInputElement) input.setAttribute('aria-invalid', on ? 'true' : 'false')
  }

  root.querySelectorAll<HTMLInputElement>('input[name="meetingType"]').forEach((input) => {
    input.addEventListener(
      'change',
      () => {
        if (!input.checked) return
        state.typeId = input.value
        void loadMonth()
        renderSummary()
      },
      { signal },
    )
  })

  prevBtn?.addEventListener(
    'click',
    () => {
      state.month = shiftMonth(state.month, -1)
      void loadMonth()
    },
    { signal },
  )
  nextBtn?.addEventListener(
    'click',
    () => {
      state.month = shiftMonth(state.month, 1)
      void loadMonth()
    },
    { signal },
  )

  calendarEl.addEventListener(
    'click',
    (event) => {
      const btn = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-date]')
      if (!btn || btn.disabled) return
      state.date = btn.dataset.date ?? null
      renderCalendar()
      if (state.date) void loadSlots(state.date)
    },
    { signal },
  )

  slotsEl.addEventListener(
    'click',
    (event) => {
      const btn = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-slot]')
      if (!btn) return
      state.slot = btn.dataset.slot ?? null
      renderSlots()
      toggleDetails()
      showStatus('', '')
    },
    { signal },
  )

  form.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault()
      if (!state.slot) return
      const raw = {
        name: value(form, 'name'),
        email: value(form, 'email'),
        phone: value(form, 'phone'),
        notes: value(form, 'notes'),
        website: value(form, 'website'),
      }
      const result = validateBookingDetails(raw)
      fieldError('name', result.errors.includes('name'))
      fieldError('email', result.errors.includes('email'))
      fieldError('phone', result.errors.includes('phone'))
      if (!result.ok) {
        const first = result.errors[0]
        showStatus(
          first === 'email' ? copy.errorEmail : first === 'phone' ? copy.errorPhone : copy.errorName,
          'error',
        )
        const focus = form.querySelector(`[data-field="${first}"] input`)
        if (focus instanceof HTMLInputElement) focus.focus()
        return
      }

      const detailsNorm = normalizeBookingDetails(raw)
      submitBtn.disabled = true
      submitBtn.textContent = copy.submitting
      showStatus(copy.submitting, 'pending')

      try {
        const data = await postJson<{ event: BookedEvent }>(`${apiUrl}/book`, {
          meetingTypeId: state.typeId,
          startTime: state.slot,
          name: detailsNorm.name,
          email: detailsNorm.email,
          phone: detailsNorm.phone || undefined,
          notes: detailsNorm.notes || undefined,
          website: raw.website,
        }, signal)
        showStatus('', '')
        panel.hidden = true
        success.hidden = false
        const when = formatRange(data.event.start, data.event.end, lang, visitorTz)
        if (successWhen) successWhen.textContent = when
        if (successLead) successLead.textContent = copy.successLead.replace('{email}', detailsNorm.email)
        if (icsLink) {
          const href = makeIcs(data.event)
          icsLink.href = href
          icsLink.download = 'baseet-studio.ics'
        }
      } catch (err) {
        if (isAbort(err)) return
        showStatus(messageForError(err, copy), 'error')
      } finally {
        submitBtn.disabled = false
        submitBtn.textContent = copy.confirm
      }
    },
    { signal },
  )

  root.querySelector('[data-booking-reset]')?.addEventListener(
    'click',
    () => {
      success.hidden = true
      panel.hidden = false
      form.reset()
      if (extra) extra.hidden = true
      if (extraToggle) {
        extraToggle.setAttribute('aria-expanded', 'false')
        extraToggle.textContent = copy.more
      }
      state.date = null
      state.slot = null
      state.slots = []
      renderCalendar()
      renderSlots()
      toggleDetails()
      showStatus('', '')
      void loadMonth()
    },
    { signal },
  )

  extraToggle?.addEventListener(
    'click',
    () => {
      if (!extra) return
      extra.hidden = !extra.hidden
      extraToggle.setAttribute('aria-expanded', extra.hidden ? 'false' : 'true')
      extraToggle.textContent = extra.hidden ? copy.more : copy.less
    },
    { signal },
  )

  void loadMonth()
}

function readCopy(root: HTMLElement): Copy | null {
  const raw = root.querySelector('[data-booking-copy]')?.textContent
  if (!raw) return null
  try {
    return JSON.parse(raw) as Copy
  } catch {
    return null
  }
}

function renderWeekdays(el: HTMLElement, lang: string): void {
  const start = weekStart(lang)
  const monday = Date.UTC(2026, 0, 5, 12)
  const offset = start === 7 ? -1 : start - 1
  const fmt = new Intl.DateTimeFormat(lang, { weekday: 'short' })
  el.innerHTML = Array.from({ length: 7 }, (_, i) => {
    const label = fmt.format(new Date(monday + (offset + i) * 86400000))
    return `<span>${escapeHtml(label)}</span>`
  }).join('')
}

function weekStart(lang: string): number {
  try {
    const locale = new Intl.Locale(lang) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number }
      weekInfo?: { firstDay: number }
    }
    return locale.getWeekInfo?.()?.firstDay ?? locale.weekInfo?.firstDay ?? 1
  } catch {
    return 1
  }
}

function weekdayIndex(ymd: string, firstDay: number): number {
  const [year, month, day] = ymd.split('-').map(Number)
  const utcDay = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()
  const iso = utcDay === 0 ? 7 : utcDay
  return (iso - firstDay + 7) % 7
}

function daysInMonth(month: string): string[] {
  const [year, monthNum] = month.split('-').map(Number)
  const last = new Date(Date.UTC(year, monthNum, 0)).getUTCDate()
  return Array.from({ length: last }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)
}

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function todayYmd(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function addDays(ymd: string, days: number): string {
  const [year, month, day] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(year, month - 1, day + days))
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
}

function shiftMonth(month: string, delta: number): string {
  const [year, monthNum] = month.split('-').map(Number)
  const dt = new Date(year, monthNum - 1 + delta, 1)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}

function timezoneLabel(tz: string, lang: string): string {
  try {
    const parts = new Intl.DateTimeFormat(lang, { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date())
    const name = parts.find((part) => part.type === 'timeZoneName')?.value
    return name ? `${name} (${tz.replace(/_/g, ' ')})` : tz.replace(/_/g, ' ')
  } catch {
    return tz.replace(/_/g, ' ')
  }
}

function formatRange(startIso: string, endIso: string, lang: string, timeZone: string): string {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const day = new Intl.DateTimeFormat(lang, { timeZone, weekday: 'long', month: 'long', day: 'numeric' }).format(start)
  const time = new Intl.DateTimeFormat(lang, { timeZone, hour: 'numeric', minute: '2-digit' })
  return `${day} · ${time.format(start)}–${time.format(end)}`
}

function value(form: HTMLFormElement, name: string): string {
  const field = form.elements.namedItem(name)
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) return field.value
  return ''
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] as string))
}

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function getJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  return readJson<T>(response)
}

async function postJson<T>(url: string, body: unknown, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  return readJson<T>(response)
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => null)) as T & { error?: { code?: string; message?: string } }
  if (!response.ok) {
    throw new ApiError(data?.error?.message || `Request failed (${response.status})`, data?.error?.code || 'generic')
  }
  return data
}

function messageForError(err: unknown, copy: Copy): string {
  if (err instanceof ApiError) {
    if (err.code === 'slot_taken') return copy.errorSlotTaken
    if (err.code === 'rate_limit') return copy.errorRateLimit
    if (err.code === 'validation') return err.message || copy.errorGeneric
    return err.message || copy.errorGeneric
  }
  return copy.errorNetwork
}

function makeIcs(event: BookedEvent): string {
  const stamp = toIcsUtc(new Date().toISOString())
  const start = toIcsUtc(event.start)
  const end = toIcsUtc(event.end)
  const meet = event.meetUrl || event.hangoutLink || ''
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Baseet Studio//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id || start}@baseetstudio.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${icsEscape(event.summary || 'Baseet Studio meeting')}`,
    meet ? `LOCATION:${icsEscape(meet)}` : '',
    meet ? `URL:${icsEscape(meet)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  return URL.createObjectURL(blob)
}

function toIcsUtc(iso: string): string {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '').replace(/Z$/, 'Z')
}

function icsEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, '\\$&')
}
