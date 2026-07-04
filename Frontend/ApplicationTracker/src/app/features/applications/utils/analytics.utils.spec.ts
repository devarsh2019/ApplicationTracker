import { describe, expect, it } from 'vitest';

import { buildAnalytics, shiftIsoDate } from './analytics.utils';

describe('buildAnalytics', () => {
  it('returns empty analytics for no data', () => {
    const result = buildAnalytics([], []);

    expect(result.totalApplications).toBe(0);
    expect(result.activeDays).toBe(0);
    expect(result.averagePerActiveDay).toBe(0);
    expect(result.busiestDay).toBeNull();
    expect(result.chartBars).toEqual([]);
    expect(result.statusSegments).toEqual([]);
    expect(result.donutGradient).toContain('conic-gradient');
  });

  it('computes totals, bars, and status segments', () => {
    const result = buildAnalytics(
      [
        { appliedDate: '2026-07-03', count: 2 },
        { appliedDate: '2026-07-04', count: 1 },
      ],
      [
        { status: 'UNDER_CONSIDERATION', count: 2 },
        { status: 'NEXT_STAGE', count: 1 },
      ],
    );

    expect(result.totalApplications).toBe(3);
    expect(result.activeDays).toBe(2);
    expect(result.averagePerActiveDay).toBe(1.5);
    expect(result.busiestDay).toEqual({ appliedDate: '2026-07-03', count: 2 });
    expect(result.chartBars).toHaveLength(2);
    expect(result.chartBars[0].widthPercent).toBe(100);
    expect(result.chartBars[1].widthPercent).toBe(50);
    expect(result.statusSegments).toHaveLength(2);
    expect(result.donutGradient).toContain('#a78bfa');
  });

  it('filters zero-count status rows from segments', () => {
    const result = buildAnalytics(
      [{ appliedDate: '2026-07-04', count: 1 }],
      [
        { status: 'UNDER_CONSIDERATION', count: 1 },
        { status: 'REJECTED', count: 0 },
      ],
    );

    expect(result.statusSegments).toHaveLength(1);
    expect(result.statusSegments[0].status).toBe('UNDER_CONSIDERATION');
    expect(result.statusSegments[0].percent).toBe(100);
  });
});

describe('shiftIsoDate', () => {
  it('shifts dates forward and backward', () => {
    expect(shiftIsoDate('2026-07-04', 1)).toBe('2026-07-05');
    expect(shiftIsoDate('2026-07-04', -1)).toBe('2026-07-03');
  });
});
