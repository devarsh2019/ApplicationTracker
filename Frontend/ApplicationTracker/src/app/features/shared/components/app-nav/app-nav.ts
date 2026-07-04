import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../auth/services/auth.service';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-app-nav',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, ThemeToggle],
  templateUrl: './app-nav.html',
  styleUrl: './app-nav.scss',
})
export class AppNav {
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
