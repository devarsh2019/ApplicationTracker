export type CalendarEventType = 'INTERVIEW' | 'REMINDER' | 'TASK' | 'OTHER';

export interface CalendarEvent {
  id: string;
  title: string;
  notes: string | null;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  eventType: CalendarEventType;
  applicationId: string | null;
  applicationCompanyName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEventPayload {
  title: string;
  notes: string | null;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  eventType: CalendarEventType;
  applicationId: string | null;
}

export interface CalendarEventListParams {
  from: string;
  to: string;
}

export const CALENDAR_EVENT_TYPE_OPTIONS: { value: CalendarEventType; label: string }[] = [
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'REMINDER', label: 'Reminder' },
  { value: 'TASK', label: 'Task' },
  { value: 'OTHER', label: 'Other' },
];

export const CALENDAR_EVENT_COLORS: Record<CalendarEventType, string> = {
  INTERVIEW: '#34d399',
  REMINDER: '#a78bfa',
  TASK: '#fbbf24',
  OTHER: '#94a3b8',
};
