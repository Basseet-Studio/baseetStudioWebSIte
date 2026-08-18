import type { Env } from './env'

const LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000

type Counter = { count: number; reset: number }

export async function consumeBookLimit(env: Env, request: Request): Promise<'ok' | 'limited'> {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('CF-Connecting-IPv6') || 'unknown'
  const key = `book:${ip}`
  const now = Date.now()
  const raw = await env.BOOKING_LIMITS.get(key)
  let data: Counter = raw ? (JSON.parse(raw) as Counter) : { count: 0, reset: now + WINDOW_MS }
  if (now >= data.reset) data = { count: 0, reset: now + WINDOW_MS }
  if (data.count >= LIMIT) return 'limited'
  data.count += 1
  const ttl = Math.max(60, Math.ceil((data.reset - now) / 1000))
  await env.BOOKING_LIMITS.put(key, JSON.stringify(data), { expirationTtl: ttl })
  return 'ok'
}
