import { describe, expect, it } from 'vitest';

import { CalendarEvent } from '../models/calendar.models';
import {
  buildEventEndsAt,
  buildEventStartsAt,
  buildMonthGrid,
  combineDateAndTime,
  formatEventTime,
  formatIsoDate,
  getMonthRange,
  groupEventsByDate,
  parseIsoDateTime,
  startOfDayDate,
  toLocalDateTimeIso,
} from './calendar.utils';

describe('calendar.utils', () => {
  it('groups events by date and sorts by start time', () => {
    const events: CalendarEvent[] = [
      {
        id: '2',
        title: 'Follow up',
        notes: null,
        startsAt: '2026-07-04T14:00:00',
        endsAt: null,
        allDay: false,
        eventType: 'REMINDER',
        applicationId: null,
        applicationCompanyName: null,
        createdAt: '2026-07-04T00:00:00Z',
        updatedAt: '2026-07-04T00:00:00Z',
      },
      {
        id: '1',
        title: 'Interview',
        notes: null,
        startsAt: '2026-07-04T10:00:00',
        endsAt: null,
        allDay: false,
        eventType: 'INTERVIEW',
        applicationId: null,
        applicationCompanyName: null,
        createdAt: '2026-07-04T00:00:00Z',
        updatedAt: '2026-07-04T00:00:00Z',
      },
    ];

    const grouped = groupEventsByDate(events);
    expect(grouped.get('2026-07-04')).toEqual([
      expect.objectContaining({ id: '1' }),
      expect.objectContaining({ id: '2' }),
    ]);
  });

  it('builds month grid with event markers', () => {
    const events = groupEventsByDate([
      {
        id: '1',
        title: 'Task',
        notes: null,
        startsAt: '2026-07-04T09:00:00',
        endsAt: null,
        allDay: true,
        eventType: 'TASK',
        applicationId: null,
        applicationCompanyName: null,
        createdAt: '2026-07-04T00:00:00Z',
        updatedAt: '2026-07-04T00:00:00Z',
      },
    ]);

    const grid = buildMonthGrid(2026, 6, '2026-07-04', events);
    const targetDay = grid.weeks.flat().find((day) => day.isoDate === '2026-07-04');

    expect(targetDay?.eventCount).toBe(1);
    expect(targetDay?.isSelected).toBe(true);
    expect(targetDay?.eventTypes).toEqual(['TASK']);
  });

  it('returns month range including last day', () => {
    expect(getMonthRange(2026, 1)).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(getMonthRange(2024, 1)).toEqual({ from: '2024-02-01', to: '2024-02-29' });
  });

  it('combines date and time without shifting the day', () => {
    const date = new Date(2026, 6, 4);
    const time = new Date(2026, 0, 1, 15, 30, 0, 0);
    expect(toLocalDateTimeIso(combineDateAndTime(date, time))).toBe('2026-07-04T15:30:00');
  });

  it('builds timed start and end datetimes', () => {
    const startDate = new Date(2026, 6, 4);
    const startTime = new Date(2026, 0, 1, 10, 0, 0, 0);
    const endDate = new Date(2026, 6, 4);
    const endTime = new Date(2026, 0, 1, 11, 0, 0, 0);

    expect(
      buildEventStartsAt({
        allDay: false,
        startDate,
        startTime,
      }),
    ).toBe('2026-07-04T10:00:00');

    expect(
      buildEventEndsAt({
        allDay: false,
        endDate,
        endTime,
      }),
    ).toBe('2026-07-04T11:00:00');
  });

  it('builds all-day start at midnight and end at end of day', () => {
    const startDate = new Date(2026, 6, 4);
    const endDate = new Date(2026, 6, 5);

    expect(
      buildEventStartsAt({
        allDay: true,
        startDate,
        startTime: null,
      }),
    ).toBe('2026-07-04T00:00:00');

    expect(
      buildEventEndsAt({
        allDay: true,
        endDate,
        endTime: null,
      }),
    ).toBe('2026-07-05T23:59:59');
  });

  it('returns null end when optional end date or time is missing', () => {
    expect(
      buildEventEndsAt({
        allDay: false,
        endDate: null,
        endTime: new Date(2026, 0, 1, 11, 0, 0, 0),
      }),
    ).toBeNull();

    expect(
      buildEventEndsAt({
        allDay: false,
        endDate: new Date(2026, 6, 4),
        endTime: null,
      }),
    ).toBeNull();
  });

  it('throws when timed start is missing required fields', () => {
    expect(() =>
      buildEventStartsAt({
        allDay: false,
        startDate: null,
        startTime: new Date(2026, 0, 1, 10, 0, 0, 0),
      }),
    ).toThrow('Start date is required.');

    expect(() =>
      buildEventStartsAt({
        allDay: false,
        startDate: new Date(2026, 6, 4),
        startTime: null,
      }),
    ).toThrow('Start time is required.');
  });

  it('parses iso datetime into separate date and time parts', () => {
    const parsed = parseIsoDateTime('2026-07-04T15:45:00');
    expect(formatIsoDate(parsed.date)).toBe('2026-07-04');
    expect(parsed.time.getHours()).toBe(15);
    expect(parsed.time.getMinutes()).toBe(45);
  });

  it('formats all-day event labels', () => {
    expect(
      formatEventTime({
        id: '1',
        title: 'Task',
        notes: null,
        startsAt: '2026-07-04T00:00:00',
        endsAt: null,
        allDay: true,
        eventType: 'TASK',
        applicationId: null,
        applicationCompanyName: null,
        createdAt: '2026-07-04T00:00:00Z',
        updatedAt: '2026-07-04T00:00:00Z',
      }),
    ).toBe('All day');
  });

  it('normalizes startOfDayDate from iso strings', () => {
    const date = startOfDayDate('2026-07-04');
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(formatIsoDate(date)).toBe('2026-07-04');
  });
});
