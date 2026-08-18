export type MeetingType = {
  id: string
  label: string
  durationMinutes: number
  description: string
  virtual: boolean
}

export type AvailabilityConfig = {
  workingDays: string[]
  workingHours: { start: string; end: string }
  bufferMinutes: number
  minNoticeHours: number
  maxDaysAhead: number
}

export const meetingTypes: MeetingType[] = [
  {
    id: 'consultation',
    label: 'Consultation Call',
    durationMinutes: 30,
    description: 'A 30-minute call to talk through what you are building.',
    virtual: true,
  },
  {
    id: 'demo',
    label: 'Product Demo',
    durationMinutes: 45,
    description: 'A 45-minute walkthrough of a product or idea.',
    virtual: true,
  },
]

export const availability: AvailabilityConfig = {
  workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  workingHours: { start: '09:00', end: '17:00' },
  bufferMinutes: 15,
  minNoticeHours: 4,
  maxDaysAhead: 30,
}

export function getMeetingType(id: string): MeetingType | undefined {
  return meetingTypes.find((type) => type.id === id)
}
