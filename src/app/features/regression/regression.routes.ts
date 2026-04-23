import { Routes } from '@angular/router';
import { AnalysisWorkbenchPageComponent } from '../common/pages/analysis-workbench.page';

export const REGRESSION_ROUTES: Routes = [
  {
    path: '',
    component: AnalysisWorkbenchPageComponent,
    data: {
      module: 'regression',
      title: '7. Regresión y Modelado',
      description: 'Regresión lineal simple/múltiple/logística, polinomial y correlación.',
      analyses: ['Regresión lineal simple', 'Regresión lineal múltiple', 'Regresión logística', 'Modelo polinomial', 'Correlación']
    }
  }
];
