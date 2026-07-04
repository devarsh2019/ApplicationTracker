import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiError } from '../../auth/models/auth.models';
import {
  CalendarEvent,
  CalendarEventListParams,
  CalendarEventPayload,
} from '../models/calendar.models';

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/calendar/events`;

  list(params: CalendarEventListParams): Observable<CalendarEvent[]> {
    const httpParams = new HttpParams().set('from', params.from).set('to', params.to);

    return this.http
      .get<CalendarEvent[]>(this.baseUrl, { params: httpParams })
      .pipe(catchError((error) => throwError(() => this.toError(error))));
  }

  create(payload: CalendarEventPayload): Observable<CalendarEvent> {
    return this.http
      .post<CalendarEvent>(this.baseUrl, payload)
      .pipe(catchError((error) => throwError(() => this.toError(error))));
  }

  update(id: string, payload: CalendarEventPayload): Observable<CalendarEvent> {
    return this.http
      .put<CalendarEvent>(`${this.baseUrl}/${id}`, payload)
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
