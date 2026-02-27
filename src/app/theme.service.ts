import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Observable to track current theme
  private darkModeSubject = new BehaviorSubject<boolean>(this.loadThemePreference());
  public darkMode$ = this.darkModeSubject.asObservable();

  constructor() {
    // Apply the saved theme on initialization
    this.applyTheme(this.darkModeSubject.value);
  }

  /**
   * Load theme preference from localStorage
   * Default to light mode if no preference is saved
   */
  private loadThemePreference(): boolean {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  }

  /**
   * Toggle between dark and light theme
   */
  toggleTheme(): void {
    const newTheme = !this.darkModeSubject.value;
    this.darkModeSubject.next(newTheme);
    this.applyTheme(newTheme);
    this.saveThemePreference(newTheme);
  }

  /**
   * Set specific theme
   */
  setTheme(isDark: boolean): void {
    this.darkModeSubject.next(isDark);
    this.applyTheme(isDark);
    this.saveThemePreference(isDark);
  }

  /**
   * Apply theme to document body
   */
  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }

  /**
   * Save theme preference to localStorage
   */
  private saveThemePreference(isDark: boolean): void {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  /**
   * Get current theme state
   */
  isDarkMode(): boolean {
    return this.darkModeSubject.value;
  }
}
