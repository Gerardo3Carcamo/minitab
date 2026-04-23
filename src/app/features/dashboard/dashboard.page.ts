import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ModuleShortcut {
  title: string;
  path: string;
  description: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <h2>Dashboard</h2>
        <p>Accesos rápidos a carga, preparación, análisis y exportación.</p>
      </header>

      <div class="metrics-grid">
        <article class="card metric">
          <h3>Flujo recomendado</h3>
          <p>1) Carga de datos -> 2) Workspace -> 3) Limpieza -> 4) Descriptiva -> 5) Gráficas</p>
        </article>
        <article class="card metric">
          <h3>Arquitectura</h3>
          <p>Standalone + Signals + Reactive Forms + Router lazy + Interceptores globales.</p>
        </article>
      </div>

      <div class="grid">
        <a *ngFor="let module of modules" class="module-card" [routerLink]="module.path">
          <h3>{{ module.title }}</h3>
          <p>{{ module.description }}</p>
        </a>
      </div>
    </section>
  `,
  styles: [`
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
    }
    .module-card {
      text-decoration: none;
      color: inherit;
      border: 1px solid #d2e1e6;
      border-radius: 14px;
      padding: 14px;
      background: #ffffff;
      transition: transform 0.15s ease;
    }
    .module-card:hover {
      transform: translateY(-2px);
    }
    h3 {
      margin: 0 0 6px;
    }
    p {
      margin: 0;
      color: #5e7783;
    }
    .metric p {
      color: #4f6977;
    }
  `]
})
export class DashboardPageComponent {
  readonly modules: ModuleShortcut[] = [
    { title: 'Carga e Importación', path: '/data-import', description: 'Sube Excel/CSV/TXT, selecciona hoja y columnas.' },
    { title: 'Workspace', path: '/workspace', description: 'Edición tabular, filtros, búsqueda y resumen.' },
    { title: 'Limpieza', path: '/cleaning', description: 'Missing values, outliers y transformaciones.' },
    { title: 'Descriptiva', path: '/descriptive', description: 'Media, mediana, varianza, percentiles y frecuencia.' },
    { title: 'Visualización', path: '/visualization', description: 'Histogramas, boxplots, dispersión, líneas, pareto y heatmaps.' },
    { title: 'Inferencia', path: '/inference', description: 'Pruebas t, ANOVA, chi-cuadrada y no paramétricas.' },
    { title: 'Regresión', path: '/regression', description: 'Lineal, múltiple, logística y correlación.' },
    { title: 'DOE', path: '/doe', description: 'Diseños factoriales y análisis de efectos.' },
    { title: 'SPC', path: '/spc', description: 'Cartas de control y capacidad de proceso.' },
    { title: 'Calidad', path: '/quality', description: 'Pareto, Ishikawa, defectos y DMAIC.' },
    { title: 'Series de Tiempo', path: '/time-series', description: 'Pronóstico, suavizamiento y ARIMA.' },
    { title: 'Multivariada', path: '/multivariate', description: 'PCA, clustering y discriminante.' },
    { title: 'Automatización', path: '/automation', description: 'Guardar y re-ejecutar análisis.' },
    { title: 'Reportes', path: '/reports', description: 'Exportación a PDF/XLSX con vista previa.' }
  ];
}
