import { Routes } from '@angular/router';
import { AnalysisWorkbenchPageComponent } from '../common/pages/analysis-workbench.page';

export const SPC_ROUTES: Routes = [
  {
    path: '',
    component: AnalysisWorkbenchPageComponent,
    data: {
      module: 'spc',
      title: '9. Control Estadístico de Procesos (SPC)',
      description: 'Cartas X-barra, R, p, np, c, u y análisis de capacidad Cp/Cpk.',
      analyses: ['Carta X-barra', 'Carta R', 'Carta p', 'Carta np', 'Carta c', 'Carta u', 'Capacidad de proceso']
    }
  }
];
