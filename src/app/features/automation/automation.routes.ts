import { Routes } from '@angular/router';
import { AnalysisWorkbenchPageComponent } from '../common/pages/analysis-workbench.page';

export const AUTOMATION_ROUTES: Routes = [
  {
    path: '',
    component: AnalysisWorkbenchPageComponent,
    data: {
      module: 'automation',
      title: '13. Automatización de Análisis',
      description: 'Guardar configuraciones, repetir análisis y revisar historial de ejecuciones.',
      analyses: ['Guardar configuración', 'Re-ejecutar análisis', 'Historial de ejecuciones']
    }
  }
];
