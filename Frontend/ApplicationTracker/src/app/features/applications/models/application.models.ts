export type ApplicationStatus = 'UNDER_CONSIDERATION' | 'REJECTED' | 'NEXT_STAGE';

export interface JobApplication {
  id: string;
  companyName: string;
  appliedDate: string;
  companyLink: string | null;
  contactFollowUp: string | null;
  status: ApplicationStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyCount {
  appliedDate: string;
  count: number;
}

export interface StatusCount {
  status: ApplicationStatus;
  count: number;
}

export interface ApplicationStats {
  totalApplications: number;
  activeDays: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApplicationPayload {
  companyName: string;
  appliedDate: string;
  companyLink?: string | null;
  contactFollowUp?: string | null;
  status?: ApplicationStatus;
  notes?: string | null;
}

export interface ApplicationListParams {
  page?: number;
  size?: number;
  appliedDate?: string | null;
}

export const APPLICATION_STATUS_OPTIONS: ReadonlyArray<{
  value: ApplicationStatus;
  label: string;
}> = [
  { value: 'UNDER_CONSIDERATION', label: 'Under consideration' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'NEXT_STAGE', label: 'Next stage' },
];

export function applicationStatusLabel(status: ApplicationStatus): string {
  return APPLICATION_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}
