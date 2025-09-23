import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./shell/shell.component').then(m => m.ShellComponent),
  },
];
