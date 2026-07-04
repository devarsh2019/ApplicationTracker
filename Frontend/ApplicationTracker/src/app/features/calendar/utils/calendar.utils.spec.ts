import { describe, expect, it } from 'vitest';

import { CalendarEvent } from '../models/calendar.models';
import { buildMonthGrid, formatIsoDate, groupEventsByDate } from './calendar.utils';

describe('calendar.utils', () => {
  it('groups events by date', () => {
    const events: CalendarEvent[] = [
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
    ];

    const grouped = groupEventsByDate(events);
    expect(grouped.get('2026-07-04')).toHaveLength(2);
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
    const flatDays = grid.weeks.flat();
    const targetDay = flatDays.find((day) => day.isoDate === '2026-07-04');

    expect(targetDay?.eventCount).toBe(1);
    expect(targetDay?.isSelected).toBe(true);
  });

  it('formats iso dates', () => {
    expect(formatIsoDate(new Date(2026, 6, 4))).toBe('2026-07-04');
  });
});
