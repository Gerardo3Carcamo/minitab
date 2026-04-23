import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { MockApiService } from '../mock/mock-api.service';

export type AnalysisModule =
  | 'inference'
  | 'regression'
  | 'doe'
  | 'spc'
  | 'quality'
  | 'time-series'
  | 'multivariate'
  | 'automation';

@Injectable({ providedIn: 'root' })
export class ModuleRunnerApiService {
  private readonly settings = inject(APP_SETTINGS);

  constructor(
    private readonly http: HttpClient,
    private readonly mock: MockApiService
  ) {}

  run(module: AnalysisModule, payload: Record<string, unknown>): Observable<Record<string, unknown>> {
    if (this.settings.useMockApi) {
      return this.mock.runModule(module, payload);
    }

    const analysisType = String(payload['analysisType'] ?? '');
    const endpoint = resolveEndpoint(module, analysisType);
    const body = { ...payload };
    delete body['analysisType'];

    if (endpoint.method === 'GET') {
      const query: Record<string, string> = {};
      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined && value !== null) {
          query[key] = String(value);
        }
      }
      return this.http.get<Record<string, unknown>>(endpoint.path, { params: query });
    }

    return this.http.post<Record<string, unknown>>(endpoint.path, body);
  }
}

interface EndpointSpec {
  method: 'GET' | 'POST';
  path: string;
}

const ENDPOINTS: Record<AnalysisModule, Record<string, EndpointSpec>> = {
  inference: {
    'Intervalo de confianza': { method: 'POST', path: '/inference/confidence-interval' },
    'Prueba t': { method: 'POST', path: '/inference/ttest-one-sample' },
    'ANOVA': { method: 'POST', path: '/inference/anova' },
    'Chi-cuadrada': { method: 'POST', path: '/inference/chi-square' },
    'No paramétricas': { method: 'POST', path: '/inference/non-parametric' },
    'Comparación de medias': { method: 'POST', path: '/inference/ttest-two-sample' }
  },
  regression: {
    'Regresión lineal simple': { method: 'POST', path: '/regression/linear' },
    'Regresión lineal múltiple': { method: 'POST', path: '/regression/multiple' },
    'Regresión logística': { method: 'POST', path: '/regression/logistic' },
    'Modelo polinomial': { method: 'POST', path: '/regression/polynomial' },
    'Correlación': { method: 'POST', path: '/regression/correlation' }
  },
  doe: {
    'Diseño factorial': { method: 'POST', path: '/doe/factorial' },
    'Diseño fraccional': { method: 'POST', path: '/doe/fractional' },
    'Superficie de respuesta': { method: 'POST', path: '/doe/response-surface' },
    'Efectos principales': { method: 'POST', path: '/doe/effects' },
    'Interacciones': { method: 'POST', path: '/doe/effects' }
  },
  spc: {
    'Carta X-barra': { method: 'POST', path: '/spc/xbar-r' },
    'Carta R': { method: 'POST', path: '/spc/xbar-r' },
    'Carta p': { method: 'POST', path: '/spc/p' },
    'Carta np': { method: 'POST', path: '/spc/np' },
    'Carta c': { method: 'POST', path: '/spc/c' },
    'Carta u': { method: 'POST', path: '/spc/u' },
    'Capacidad de proceso': { method: 'POST', path: '/spc/capability' }
  },
  quality: {
    'Diagrama de Pareto': { method: 'POST', path: '/quality/pareto' },
    'Clasificación de defectos': { method: 'POST', path: '/quality/defects-grouping' },
    Ishikawa: { method: 'POST', path: '/quality/root-cause' },
    'Root cause analysis': { method: 'POST', path: '/quality/root-cause' },
    DMAIC: { method: 'POST', path: '/quality/root-cause' }
  },
  'time-series': {
    'Visualización de serie': { method: 'POST', path: '/timeseries/decomposition' },
    'Suavizamiento exponencial': { method: 'POST', path: '/timeseries/exponential-smoothing' },
    ARIMA: { method: 'POST', path: '/timeseries/arima' },
    'Detección de tendencia': { method: 'POST', path: '/timeseries/decomposition' },
    'Pronóstico': { method: 'POST', path: '/timeseries/forecast' }
  },
  multivariate: {
    PCA: { method: 'POST', path: '/multivariate/pca' },
    Clustering: { method: 'POST', path: '/multivariate/clustering' },
    'Análisis discriminante': { method: 'POST', path: '/multivariate/discriminant' }
  },
  automation: {
    'Guardar configuración': { method: 'POST', path: '/automation/configurations' },
    'Re-ejecutar análisis': { method: 'POST', path: '/automation/executions' },
    'Historial de ejecuciones': { method: 'GET', path: '/automation/executions' }
  }
};

function resolveEndpoint(module: AnalysisModule, analysisType: string): EndpointSpec {
  const moduleEndpoints = ENDPOINTS[module];
  const directMatch = moduleEndpoints[analysisType];
  if (directMatch) {
    return directMatch;
  }
  const fallback = Object.values(moduleEndpoints)[0];
  return fallback;
}
