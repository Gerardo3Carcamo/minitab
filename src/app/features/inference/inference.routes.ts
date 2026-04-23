import { Routes } from '@angular/router';
import { AnalysisWorkbenchPageComponent } from '../common/pages/analysis-workbench.page';

export const INFERENCE_ROUTES: Routes = [
  {
    path: '',
    component: AnalysisWorkbenchPageComponent,
    data: {
      module: 'inference',
      title: '6. Inferencia Estadística',
      description: 'Intervalos de confianza, pruebas t, ANOVA, chi-cuadrada y no paramétricas.',
      analyses: ['Intervalo de confianza', 'Prueba t', 'ANOVA', 'Chi-cuadrada', 'No paramétricas', 'Comparación de medias']
    }
  }
];
