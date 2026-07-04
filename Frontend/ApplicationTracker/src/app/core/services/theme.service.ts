import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'application-tracker-theme';
  readonly mode = signal<ThemeMode>('light');

  init(): void {
    const saved = localStorage.getItem(this.storageKey) as ThemeMode | null;
    if (saved === 'light' || saved === 'dark') {
      this.applyTheme(saved);
      return;
    }

    const prefersDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.applyTheme(prefersDark ? 'dark' : 'light');
  }

  toggle(): void {
    this.applyTheme(this.mode() === 'light' ? 'dark' : 'light');
  }

  private applyTheme(mode: ThemeMode): void {
    this.mode.set(mode);
    document.documentElement.classList.toggle('dark-theme', mode === 'dark');
    document.documentElement.style.colorScheme = mode;
    localStorage.setItem(this.storageKey, mode);
  }
}
