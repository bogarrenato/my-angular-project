import { Injectable, computed, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

export interface ThemeState {
  currentTheme: Theme;
  systemPreference: Theme;
  userPreference: Theme | null;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeStore {
  // Private signals
  private readonly _currentTheme = signal<Theme>('dark');
  private readonly _systemPreference = signal<Theme>('dark');
  private readonly _userPreference = signal<Theme | null>(null);

  // Public computed signals
  readonly currentTheme = this._currentTheme.asReadonly();
  readonly systemPreference = this._systemPreference.asReadonly();
  readonly userPreference = this._userPreference.asReadonly();
  
  // Computed properties
  readonly isDark = computed(() => this._currentTheme() === 'dark');
  readonly isLight = computed(() => this._currentTheme() === 'light');
  readonly themeIcon = computed(() => this.isDark() ? 'pi pi-moon' : 'pi pi-sun');
  readonly themeLabel = computed(() => this.isDark() ? 'Sötét téma' : 'Világos téma');

  constructor() {
    // Initialize theme from localStorage or system preference
    this.initializeTheme();
    
    // Effect to apply theme to document
    effect(() => {
      const theme = this._currentTheme();
      document.body.dataset['theme'] = theme;
      document.documentElement.setAttribute('data-theme', theme);
      
      // Store user preference
      if (this._userPreference() !== null) {
        localStorage.setItem('theme-preference', theme);
      }
    });
  }

  private initializeTheme(): void {
    // Check for saved user preference
    const savedPreference = localStorage.getItem('theme-preference') as Theme | null;
    if (savedPreference && (savedPreference === 'dark' || savedPreference === 'light')) {
      this._userPreference.set(savedPreference);
      this._currentTheme.set(savedPreference);
      return;
    }

    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemTheme: Theme = prefersDark ? 'dark' : 'light';
    this._systemPreference.set(systemTheme);
    this._currentTheme.set(systemTheme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const newSystemTheme: Theme = e.matches ? 'dark' : 'light';
      this._systemPreference.set(newSystemTheme);
      
      // Only update if user hasn't set a preference
      if (this._userPreference() === null) {
        this._currentTheme.set(newSystemTheme);
      }
    });
  }

  // Actions
  setTheme(theme: Theme): void {
    this._userPreference.set(theme);
    this._currentTheme.set(theme);
  }

  toggleTheme(): void {
    const newTheme: Theme = this._currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  resetToSystem(): void {
    this._userPreference.set(null);
    this._currentTheme.set(this._systemPreference());
    localStorage.removeItem('theme-preference');
  }

  // Getters for state
  getState(): ThemeState {
    return {
      currentTheme: this._currentTheme(),
      systemPreference: this._systemPreference(),
      userPreference: this._userPreference()
    };
  }
}
