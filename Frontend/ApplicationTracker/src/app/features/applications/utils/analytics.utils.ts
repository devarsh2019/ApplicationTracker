import { DailyCount, ApplicationStatus, StatusCount } from '../models/application.models';

export interface ChartBar {
  appliedDate: string;
  count: number;
  widthPercent: number;
}

export interface StatusSegment {
  status: ApplicationStatus;
  count: number;
  percent: number;
  color: string;
  label: string;
}

export interface ApplicationAnalytics {
  totalApplications: number;
  activeDays: number;
  averagePerActiveDay: number;
  busiestDay: DailyCount | null;
  last7DaysCount: number;
  last30DaysCount: number;
  chartBars: ChartBar[];
  statusSegments: StatusSegment[];
  donutGradient: string;
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  UNDER_CONSIDERATION: '#a78bfa',
  REJECTED: '#f87171',
  NEXT_STAGE: '#34d399',
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  UNDER_CONSIDERATION: 'Under consideration',
  REJECTED: 'Rejected',
  NEXT_STAGE: 'Next stage',
};

export function buildAnalytics(
  dailyCounts: DailyCount[],
  statusCounts: StatusCount[],
): ApplicationAnalytics {
  const totalApplications = dailyCounts.reduce((sum, row) => sum + row.count, 0);
  const activeDays = dailyCounts.length;
  const averagePerActiveDay = activeDays > 0 ? totalApplications / activeDays : 0;

  const busiestDay =
    dailyCounts.length > 0
      ? dailyCounts.reduce((max, row) => (row.count > max.count ? row : max), dailyCounts[0])
      : null;

  const today = startOfDay(new Date());
  const last7Start = addDays(today, -6);
  const last30Start = addDays(today, -29);

  let last7DaysCount = 0;
  let last30DaysCount = 0;

  for (const row of dailyCounts) {
    const date = parseIsoDate(row.appliedDate);
    if (date >= last7Start && date <= today) {
      last7DaysCount += row.count;
    }
    if (date >= last30Start && date <= today) {
      last30DaysCount += row.count;
    }
  }

  const sortedCounts = [...dailyCounts].sort((a, b) => a.appliedDate.localeCompare(b.appliedDate));
  const maxCount = sortedCounts.reduce((max, row) => Math.max(max, row.count), 0);

  const chartBars: ChartBar[] = sortedCounts.map((row) => ({
    appliedDate: row.appliedDate,
    count: row.count,
    widthPercent: maxCount > 0 ? (row.count / maxCount) * 100 : 0,
  }));

  const statusSegments = buildStatusSegments(statusCounts, totalApplications);
  const donutGradient = buildDonutGradient(statusSegments);

  return {
    totalApplications,
    activeDays,
    averagePerActiveDay,
    busiestDay,
    last7DaysCount,
    last30DaysCount,
    chartBars,
    statusSegments,
    donutGradient,
  };
}

function buildStatusSegments(statusCounts: StatusCount[], total: number): StatusSegment[] {
  if (total === 0) {
    return [];
  }

  return statusCounts
    .filter((row) => row.count > 0)
    .map((row) => ({
      status: row.status,
      count: row.count,
      percent: (row.count / total) * 100,
      color: STATUS_COLORS[row.status],
      label: STATUS_LABELS[row.status],
    }))
    .sort((a, b) => b.count - a.count);
}

function buildDonutGradient(segments: StatusSegment[]): string {
  if (segments.length === 0) {
    return 'conic-gradient(var(--mat-sys-surface-container-high) 0deg 360deg)';
  }

  let cursor = 0;
  const stops = segments.map((segment) => {
    const start = cursor;
    cursor += segment.percent * 3.6;
    return `${segment.color} ${start}deg ${cursor}deg`;
  });

  return `conic-gradient(${stops.join(', ')})`;
}

export function shiftIsoDate(value: string, days: number): string {
  const date = parseIsoDate(value);
  date.setDate(date.getDate() + days);
  return formatIsoDate(date);
}

export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string): Date {
  return startOfDay(new Date(`${value}T00:00:00`));
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}
