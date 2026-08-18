export interface Env {
  DB: D1Database
  TELEGRAM_BOT_TOKEN: string
  TELEGRAM_CHAT_ID: string
}

type Submission = {
  name: string
  email: string
  phone: string
  message: string
  page: string
  language: string
  subject: string
  intent: string
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS })
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const jsonHeaders = {
      ...CORS,
      'Content-Type': 'application/json',
    }

    try {
      const submission = await readSubmission(request)
      if (!submission) {
        return new Response(
          JSON.stringify({ success: false, error: `Unsupported content-type: ${request.headers.get('content-type') || ''}` }),
          { status: 415, headers: jsonHeaders },
        )
      }

      const { name, email, message } = submission
      if (!name || !email || !message) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required fields' }),
          { status: 400, headers: jsonHeaders },
        )
      }

      const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
      const storedMessage = composeStoredMessage(submission)

      const telegramError = await sendTelegram(env, { ...submission, message: storedMessage, ip })
      if (telegramError) {
        console.error('Telegram notification failed:', telegramError)
      }

      await env.DB.prepare(
        `INSERT INTO submissions (page, language, name, email, phone, message, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          submission.page,
          submission.language,
          name,
          email,
          submission.phone || null,
          storedMessage,
          ip,
        )
        .run()

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return new Response(JSON.stringify({ success: false, error: message }), {
        status: 500,
        headers: jsonHeaders,
      })
    }
  },
}

async function readSubmission(request: Request): Promise<Submission | null> {
  const contentType = request.headers.get('content-type') || ''
  let raw: Record<string, unknown>

  if (contentType.includes('application/json')) {
    const body = (await request.json()) as Record<string, unknown>
    raw = body
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(await request.text())
    raw = Object.fromEntries(params.entries())
  } else if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    raw = Object.fromEntries(
      [...formData.entries()].map(([key, value]) => [key, typeof value === 'string' ? value : value.name]),
    )
  } else {
    return null
  }

  const intent = Array.isArray(raw.intent) ? raw.intent.map(String).join(', ') : str(raw.intent)
  const pageFromReferer = refererPath(request)

  return {
    name: str(raw.name),
    email: str(raw.email),
    phone: str(raw.phone) || str(raw.phone_e164) || str(raw.phone_raw),
    message: str(raw.message),
    page: str(raw.page) || pageFromReferer || 'Unknown',
    language: str(raw.language) || str(raw.lang) || 'unknown',
    subject: str(raw.subject),
    intent,
  }
}

function composeStoredMessage(submission: Submission): string {
  const parts = [
    submission.subject ? `Subject: ${submission.subject}` : '',
    submission.intent ? `Intent: ${submission.intent}` : '',
    submission.message,
  ].filter(Boolean)
  return parts.join('\n\n')
}

async function sendTelegram(
  env: Env,
  data: Submission & { ip: string },
): Promise<string | null> {
  const text = [
    `📬 <b>New Contact Form Submission</b>`,
    ``,
    `👤 <b>Name:</b> ${escapeHtml(data.name)}`,
    `📧 <b>Email:</b> ${escapeHtml(data.email)}`,
    data.phone ? `📞 <b>Phone:</b> ${escapeHtml(data.phone)}` : null,
    data.subject ? `📝 <b>Subject:</b> ${escapeHtml(data.subject)}` : null,
    data.intent ? `🎯 <b>Intent:</b> ${escapeHtml(data.intent)}` : null,
    `💬 <b>Message:</b>`,
    escapeHtml(data.message),
    ``,
    `🌐 <b>Page:</b> ${escapeHtml(data.page)}`,
    `🗣 <b>Language:</b> ${escapeHtml(data.language)}`,
    `🔌 <b>IP:</b> ${data.ip}`,
  ]
    .filter((line) => line !== null)
    .join('\n')

  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
      }),
    })
    if (!res.ok) {
      return `HTTP ${res.status}: ${await res.text()}`
    }
    return null
  } catch (err) {
    return err instanceof Error ? err.message : String(err)
  }
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

function refererPath(request: Request): string {
  const referer = request.headers.get('Referer')
  if (!referer) return ''
  try {
    return new URL(referer).pathname || ''
  } catch {
    return ''
  }
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
