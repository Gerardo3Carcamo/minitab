import { Routes } from '@angular/router';
import { AnalysisWorkbenchPageComponent } from '../common/pages/analysis-workbench.page';

export const TIME_SERIES_ROUTES: Routes = [
  {
    path: '',
    component: AnalysisWorkbenchPageComponent,
    data: {
      module: 'time-series',
      title: '11. Series de Tiempo',
      description: 'Visualización temporal, pronóstico, suavizamiento exponencial y ARIMA.',
      analyses: ['Visualización de serie', 'Suavizamiento exponencial', 'ARIMA', 'Detección de tendencia', 'Pronóstico']
    }
  }
];
