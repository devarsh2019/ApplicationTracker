import { CalendarEvent, CalendarEventType } from '../models/calendar.models';

export interface CalendarDayCell {
  date: Date;
  isoDate: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  eventCount: number;
  eventTypes: CalendarEventType[];
}

export interface CalendarMonthGrid {
  year: number;
  month: number;
  weeks: CalendarDayCell[][];
}

export function buildMonthGrid(
  year: number,
  month: number,
  selectedIsoDate: string,
  eventsByDate: Map<string, CalendarEvent[]>,
): CalendarMonthGrid {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);
  const todayIso = formatIsoDate(new Date());
  const weeks: CalendarDayCell[][] = [];

  for (let week = 0; week < 6; week++) {
    const days: CalendarDayCell[] = [];

    for (let day = 0; day < 7; day++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + week * 7 + day);

      const isoDate = formatIsoDate(date);
      const dayEvents = eventsByDate.get(isoDate) ?? [];
      const eventTypes = [...new Set(dayEvents.map((event) => event.eventType))];

      days.push({
        date,
        isoDate,
        inCurrentMonth: date.getMonth() === month,
        isToday: isoDate === todayIso,
        isSelected: isoDate === selectedIsoDate,
        eventCount: dayEvents.length,
        eventTypes,
      });
    }

    weeks.push(days);
  }

  return { year, month, weeks };
}

export function groupEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const isoDate = event.startsAt.slice(0, 10);
    const existing = map.get(isoDate) ?? [];
    existing.push(event);
    map.set(isoDate, existing);
  }

  for (const [key, value] of map) {
    map.set(
      key,
      value.sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    );
  }

  return map;
}

export function getMonthRange(year: number, month: number): { from: string; to: string } {
  const from = formatIsoDate(new Date(year, month, 1));
  const to = formatIsoDate(new Date(year, month + 1, 0));
  return { from, to };
}

export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function combineDateAndTime(date: Date, time: Date): Date {
  const result = new Date(date);
  result.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return result;
}

export function toLocalDateTimeIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

export function parseIsoDateTime(value: string): { date: Date; time: Date } {
  const parsed = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  const date = new Date(parsed);
  date.setHours(0, 0, 0, 0);

  const time = new Date(parsed);
  time.setSeconds(0, 0);

  return { date, time };
}

export function startOfDayDate(value?: string | Date): Date {
  const date = value instanceof Date ? new Date(value) : new Date(value ? `${value.slice(0, 10)}T00:00:00` : Date.now());
  date.setHours(0, 0, 0, 0);
  return date;
}

export interface EventScheduleInput {
  allDay: boolean;
  startDate: Date | null;
  startTime: Date | null;
  endDate: Date | null;
  endTime: Date | null;
}

export function buildEventStartsAt(value: Pick<EventScheduleInput, 'allDay' | 'startDate' | 'startTime'>): string {
  if (!value.startDate) {
    throw new Error('Start date is required.');
  }

  if (value.allDay) {
    return toLocalDateTimeIso(startOfDayDate(value.startDate));
  }

  if (!value.startTime) {
    throw new Error('Start time is required.');
  }

  return toLocalDateTimeIso(combineDateAndTime(value.startDate, value.startTime));
}

export function buildEventEndsAt(value: Pick<EventScheduleInput, 'allDay' | 'endDate' | 'endTime'>): string | null {
  if (!value.endDate) {
    return null;
  }

  if (value.allDay) {
    const end = startOfDayDate(value.endDate);
    end.setHours(23, 59, 59, 0);
    return toLocalDateTimeIso(end);
  }

  if (!value.endTime) {
    return null;
  }

  return toLocalDateTimeIso(combineDateAndTime(value.endDate, value.endTime));
}

export function toLocalDateTimeInput(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function localDateTimeInputToIso(value: string): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

export function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) {
    return 'All day';
  }

  const start = new Date(event.startsAt);
  return start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
