import { Routes } from '@angular/router';
import { AnalysisWorkbenchPageComponent } from '../common/pages/analysis-workbench.page';

export const MULTIVARIATE_ROUTES: Routes = [
  {
    path: '',
    component: AnalysisWorkbenchPageComponent,
    data: {
      module: 'multivariate',
      title: '12. Estadística Multivariada',
      description: 'PCA, clustering y análisis discriminante.',
      analyses: ['PCA', 'Clustering', 'Análisis discriminante']
    }
  }
];
