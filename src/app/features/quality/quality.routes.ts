import { Routes } from '@angular/router';
import { AnalysisWorkbenchPageComponent } from '../common/pages/analysis-workbench.page';

export const QUALITY_ROUTES: Routes = [
  {
    path: '',
    component: AnalysisWorkbenchPageComponent,
    data: {
      module: 'quality',
      title: '10. Calidad y Six Sigma',
      description: 'Pareto, defectos, Ishikawa, causa raíz y flujo DMAIC.',
      analyses: ['Diagrama de Pareto', 'Clasificación de defectos', 'Ishikawa', 'Root cause analysis', 'DMAIC']
    }
  }
];
