import { Routes } from '@angular/router';
import { AnalysisWorkbenchPageComponent } from '../common/pages/analysis-workbench.page';

export const DOE_ROUTES: Routes = [
  {
    path: '',
    component: AnalysisWorkbenchPageComponent,
    data: {
      module: 'doe',
      title: '8. Diseño de Experimentos (DOE)',
      description: 'Diseños factoriales, fraccionales y superficie de respuesta.',
      analyses: ['Diseño factorial', 'Diseño fraccional', 'Superficie de respuesta', 'Efectos principales', 'Interacciones']
    }
  }
];
