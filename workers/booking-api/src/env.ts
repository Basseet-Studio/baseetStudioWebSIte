export interface Env {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GOOGLE_REFRESH_TOKEN: string
  GOOGLE_CALENDAR_ID: string
  AGENCY_TIMEZONE: string
  BOOKING_LIMITS: KVNamespace
  BOOKING_LOCK: DurableObjectNamespace
}
