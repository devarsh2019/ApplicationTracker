import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <section class="dashboard">
      <header class="dashboard__header">
        <div>
          <p class="dashboard__eyebrow">Application Tracker</p>
          <h1>Welcome, {{ userName() }}</h1>
          <p class="dashboard__subtitle">Manage your job applications from here.</p>
        </div>

        <button mat-stroked-button type="button" (click)="signOut()">
          <mat-icon>logout</mat-icon>
          Sign out
        </button>
      </header>
    </section>
  `,
  styles: `
    .dashboard {
      min-height: 100dvh;
      padding: clamp(1.5rem, 4vw, 3rem);
      background: var(--mat-sys-surface, #f8fafc);
    }

    .dashboard__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      max-width: 56rem;
      margin: 0 auto;
      padding: 2rem;
      border: 1px solid color-mix(in srgb, var(--mat-sys-outline-variant, #cbd5e1) 70%, transparent);
      border-radius: 1.25rem;
      background: var(--mat-sys-surface-container-lowest, #fff);
      box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
    }

    .dashboard__eyebrow {
      margin: 0 0 0.5rem;
      color: var(--mat-sys-primary, #4338ca);
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      letter-spacing: -0.03em;
    }

    .dashboard__subtitle {
      margin: 0.75rem 0 0;
      color: var(--mat-sys-on-surface-variant, #64748b);
    }
  `,
})
export class Dashboard {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected userName(): string {
    return this.authService.getCurrentUser()?.name ?? 'User';
  }

  protected signOut(): void {
    this.authService.logout().subscribe(() => {
      void this.router.navigate(['/auth/login']);
    });
  }
}
