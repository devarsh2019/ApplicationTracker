import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiError } from '../../auth/models/auth.models';
import {
  ApplicationListParams,
  ApplicationPayload,
  ApplicationStats,
  DailyCount,
  JobApplication,
  PageResponse,
  StatusCount,
} from '../models/application.models';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/applications`;

  list(params: ApplicationListParams = {}): Observable<PageResponse<JobApplication>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 0))
      .set('size', String(params.size ?? 20));

    if (params.appliedDate) {
      httpParams = httpParams.set('appliedDate', params.appliedDate);
    }

    return this.http
      .get<PageResponse<JobApplication>>(this.baseUrl, { params: httpParams })
      .pipe(catchError((error) => throwError(() => this.toError(error))));
  }

  getStats(): Observable<ApplicationStats> {
    return this.http
      .get<ApplicationStats>(`${this.baseUrl}/stats`)
      .pipe(catchError((error) => throwError(() => this.toError(error))));
  }

  getDailyCounts(): Observable<DailyCount[]> {
    return this.http
      .get<DailyCount[]>(`${this.baseUrl}/daily-counts`)
      .pipe(catchError((error) => throwError(() => this.toError(error))));
  }

  getStatusCounts(): Observable<StatusCount[]> {
    return this.http
      .get<StatusCount[]>(`${this.baseUrl}/status-counts`)
      .pipe(catchError((error) => throwError(() => this.toError(error))));
  }

  create(payload: ApplicationPayload): Observable<JobApplication> {
    return this.http
      .post<JobApplication>(this.baseUrl, payload)
      .pipe(catchError((error) => throwError(() => this.toError(error))));
  }

  update(id: string, payload: ApplicationPayload): Observable<JobApplication> {
    return this.http
      .put<JobApplication>(`${this.baseUrl}/${id}`, payload)
      .pipe(catchError((error) => throwError(() => this.toError(error))));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError((error) => throwError(() => this.toError(error))));
  }

  private toError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new Error('Unable to reach the server. Please check your connection and try again.');
      }

      const apiError = error.error as ApiError | null;

      if (apiError?.errors) {
        const firstFieldError = Object.values(apiError.errors)[0];
        if (firstFieldError) {
          return new Error(firstFieldError);
        }
      }

      return new Error(apiError?.message ?? 'Something went wrong. Please try again.');
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('Something went wrong. Please try again.');
  }
}
