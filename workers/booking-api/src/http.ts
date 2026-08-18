const ALLOWED_ORIGINS = new Set([
  'https://baseetstudio.com',
  'https://www.baseetstudio.com',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
])

export type ErrorBody = {
  error: { code: string; message: string }
}

export function allowedOrigin(request: Request): string | null {
  const origin = request.headers.get('Origin')
  if (origin && ALLOWED_ORIGINS.has(origin)) return origin
  return null
}

export function corsHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
  const origin = allowedOrigin(request)
  if (origin) headers['Access-Control-Allow-Origin'] = origin
  return headers
}

export function preflight(request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request) })
}

export function json(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request),
    },
  })
}

export function jsonError(
  request: Request,
  status: number,
  code: string,
  message: string,
): Response {
  const body: ErrorBody = { error: { code, message } }
  return json(request, body, status)
}
