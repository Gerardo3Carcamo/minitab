import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES)
      },
      {
        path: 'data-import',
        loadChildren: () => import('./features/data-import/data-import.routes').then((m) => m.DATA_IMPORT_ROUTES)
      },
      {
        path: 'workspace',
        loadChildren: () => import('./features/workspace/workspace.routes').then((m) => m.WORKSPACE_ROUTES)
      },
      {
        path: 'cleaning',
        loadChildren: () => import('./features/cleaning/cleaning.routes').then((m) => m.CLEANING_ROUTES)
      },
      {
        path: 'descriptive',
        loadChildren: () => import('./features/descriptive/descriptive.routes').then((m) => m.DESCRIPTIVE_ROUTES)
      },
      {
        path: 'visualization',
        loadChildren: () => import('./features/visualization/visualization.routes').then((m) => m.VISUALIZATION_ROUTES)
      },
      {
        path: 'inference',
        loadChildren: () => import('./features/inference/inference.routes').then((m) => m.INFERENCE_ROUTES)
      },
      {
        path: 'regression',
        loadChildren: () => import('./features/regression/regression.routes').then((m) => m.REGRESSION_ROUTES)
      },
      {
        path: 'doe',
        loadChildren: () => import('./features/doe/doe.routes').then((m) => m.DOE_ROUTES)
      },
      {
        path: 'spc',
        loadChildren: () => import('./features/spc/spc.routes').then((m) => m.SPC_ROUTES)
      },
      {
        path: 'quality',
        loadChildren: () => import('./features/quality/quality.routes').then((m) => m.QUALITY_ROUTES)
      },
      {
        path: 'time-series',
        loadChildren: () => import('./features/time-series/time-series.routes').then((m) => m.TIME_SERIES_ROUTES)
      },
      {
        path: 'multivariate',
        loadChildren: () => import('./features/multivariate/multivariate.routes').then((m) => m.MULTIVARIATE_ROUTES)
      },
      {
        path: 'automation',
        loadChildren: () => import('./features/automation/automation.routes').then((m) => m.AUTOMATION_ROUTES)
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.routes').then((m) => m.REPORTS_ROUTES)
      },
      {
        path: 'manual',
        loadChildren: () => import('./features/manual/manual.routes').then((m) => m.MANUAL_ROUTES)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
