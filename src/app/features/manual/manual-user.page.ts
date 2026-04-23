import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

type RequirementLevel = 'Obligatorio' | 'Condicional' | 'Opcional';

interface FlowStep {
  step: string;
  capture: string;
  output: string;
}

interface ScreenInputGuide {
  id: string;
  title: string;
  route: string;
  goal: string;
  howTo: string;
  fields: Array<{
    field: string;
    level: RequirementLevel;
    when: string;
    format: string;
  }>;
}

interface JsonAnalysisGuide {
  analysis: string;
  endpoint: string;
  required: string[];
  optional: string[];
  sample: string;
}

interface JsonModuleGuide {
  module: string;
  route: string;
  analyses: JsonAnalysisGuide[];
}

@Component({
  selector: 'app-manual-user-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page manual-page">
      <header class="page-header hero" id="inicio">
        <div>
          <h2>Manual Operativo De Usuario</h2>
          <p>
            Este manual muestra solo lo que la persona usuaria debe capturar en la app:
            que llenar, en que orden y en que modulo.
          </p>
        </div>
        <div class="hero-badge">Operacion guiada</div>
      </header>

      <div class="page-grid">
        <article class="card span-12 quick-nav">
          <h3>Indice rapido</h3>
          <nav class="chip-list">
            <a href="#flujo-principal">Flujo principal</a>
            <a href="#captura-pantallas">Captura por pantalla</a>
            <a href="#captura-json">Captura JSON avanzada</a>
            <a href="#checklist">Checklist operativo</a>
          </nav>
        </article>

        <article class="card span-12 flow-card" id="flujo-principal">
          <h3>Flujo principal de trabajo</h3>
          <p>Ejecuta este flujo para evitar errores de validacion y repetir trabajo.</p>

          <div class="flow-track" aria-label="Diagrama de flujo principal">
            <ng-container *ngFor="let step of mainFlow; let index = index; let last = last">
              <div class="flow-step">
                <span class="step-index">{{ index + 1 }}</span>
                <h4>{{ step.step }}</h4>
                <p><strong>Captura:</strong> {{ step.capture }}</p>
                <p><strong>Resultado:</strong> {{ step.output }}</p>
              </div>
              <div class="flow-arrow" *ngIf="!last">-&gt;</div>
            </ng-container>
          </div>

          <div class="decision-map" aria-label="Diagrama de decision">
            <div class="decision-title">Control de decision antes de continuar</div>
            <div class="decision-question">El resultado coincide con lo esperado?</div>
            <div class="decision-branches">
              <div class="branch ok">
                <span class="branch-label">SI</span>
                <div class="branch-box">Continua al siguiente modulo</div>
              </div>
              <div class="branch fix">
                <span class="branch-label">NO</span>
                <div class="branch-box">Regresa a Workspace o Limpieza y ajusta entradas</div>
              </div>
            </div>
          </div>
        </article>

        <article class="card span-12" id="captura-pantallas">
          <h3>Captura de datos por pantalla</h3>
          <p>
            Estas pantallas tienen formularios visuales (sin JSON). La tabla indica exactamente que debes introducir.
          </p>
        </article>

        <article class="card span-12" *ngFor="let guide of screenGuides" [attr.id]="guide.id">
          <div class="section-head">
            <div>
              <h4>{{ guide.title }}</h4>
              <p>{{ guide.goal }}</p>
            </div>
            <span class="route-chip">{{ guide.route }}</span>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Campo que capturas</th>
                  <th>Nivel</th>
                  <th>Cuando aplica</th>
                  <th>Formato esperado</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let field of guide.fields">
                  <td>{{ field.field }}</td>
                  <td><span class="level-tag">{{ field.level }}</span></td>
                  <td>{{ field.when }}</td>
                  <td><code>{{ field.format }}</code></td>
                </tr>
              </tbody>
            </table>
          </div>

          <p class="how-to"><strong>Como hacerlo:</strong> {{ guide.howTo }}</p>
        </article>

        <article class="card span-12" id="captura-json">
          <h3>Captura JSON en modulos avanzados</h3>
          <p>
            En estos modulos capturas: <strong>Tipo de analisis</strong> + <strong>Parametros (JSON)</strong>.
            <code>dataset_id</code> se autocompleta con el dataset activo o con el ultimo dataset del workspace.
          </p>
        </article>

        <article class="card span-12 json-module" *ngFor="let module of jsonModules">
          <div class="section-head">
            <div>
              <h4>{{ module.module }}</h4>
              <p>Ruta UI: <code>{{ module.route }}</code></p>
            </div>
          </div>

          <details *ngFor="let analysis of module.analyses">
            <summary>
              <span>{{ analysis.analysis }}</span>
              <code>{{ analysis.endpoint }}</code>
            </summary>
            <div class="json-details">
              <div>
                <h5>Campos obligatorios</h5>
                <ul>
                  <li *ngFor="let item of analysis.required"><code>{{ item }}</code></li>
                </ul>
              </div>
              <div>
                <h5>Campos opcionales</h5>
                <ul>
                  <li *ngFor="let item of analysis.optional"><code>{{ item }}</code></li>
                </ul>
              </div>
            </div>
            <pre><code>{{ analysis.sample }}</code></pre>
          </details>
        </article>

        <article class="card span-12" id="checklist">
          <h3>Checklist operativo antes de ejecutar</h3>
          <div class="check-grid">
            <label class="check-item"><input type="checkbox" disabled /> Dataset importado y visible en Workspace</label>
            <label class="check-item"><input type="checkbox" disabled /> Columnas objetivo validadas (nombre y tipo)</label>
            <label class="check-item"><input type="checkbox" disabled /> Nulos u outliers tratados si afectan analisis</label>
            <label class="check-item"><input type="checkbox" disabled /> Tipo de analisis correcto en el selector</label>
            <label class="check-item"><input type="checkbox" disabled /> JSON validado con campos obligatorios</label>
            <label class="check-item"><input type="checkbox" disabled /> Reporte exportado al finalizar</label>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border: 1px solid #c6dee5;
      background:
        radial-gradient(circle at 90% 10%, rgba(35, 149, 176, 0.18), transparent 38%),
        radial-gradient(circle at 10% 90%, rgba(27, 136, 98, 0.14), transparent 36%),
        #ffffff;
    }

    .hero-badge {
      align-self: flex-start;
      border: 1px solid #b9d5dd;
      background: #eff7fa;
      color: #20556a;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 0.82rem;
      font-weight: 700;
    }

    .chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .chip-list a {
      text-decoration: none;
      color: #174859;
      border: 1px solid #c7dde4;
      background: #f3fafc;
      border-radius: 999px;
      padding: 7px 11px;
      font-size: 0.86rem;
    }

    .flow-card > p {
      color: #587280;
      margin-bottom: 12px;
    }

    .flow-track {
      display: grid;
      grid-template-columns: repeat(9, minmax(0, 1fr));
      gap: 8px;
      align-items: stretch;
      margin-bottom: 14px;
    }

    .flow-step {
      grid-column: span 2;
      border: 1px solid #c6dce3;
      border-radius: 12px;
      padding: 10px;
      background: linear-gradient(170deg, #fbfeff, #edf7fa);
      position: relative;
    }

    .flow-step h4 {
      margin: 8px 0 6px;
      font-size: 0.97rem;
    }

    .flow-step p {
      margin: 0 0 4px;
      color: #49636e;
      font-size: 0.85rem;
    }

    .step-index {
      width: 24px;
      height: 24px;
      display: inline-grid;
      place-items: center;
      border-radius: 50%;
      background: linear-gradient(120deg, #0f6f89, #1f8b63);
      color: #fff;
      font-weight: 700;
      font-size: 0.8rem;
    }

    .flow-arrow {
      display: grid;
      place-items: center;
      color: #2f6e84;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .decision-map {
      border: 1px solid #cee1e7;
      border-radius: 12px;
      background: #f8fcfd;
      padding: 10px;
      display: grid;
      gap: 10px;
    }

    .decision-title {
      font-size: 0.82rem;
      color: #48636e;
      font-weight: 700;
    }

    .decision-question {
      border: 1px dashed #9ec2ce;
      border-radius: 10px;
      padding: 8px;
      text-align: center;
      color: #244b5b;
      font-weight: 700;
      background: #ffffff;
    }

    .decision-branches {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .branch {
      display: grid;
      gap: 6px;
    }

    .branch-label {
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.4px;
    }

    .ok .branch-label {
      color: #1b7a56;
    }

    .fix .branch-label {
      color: #895015;
    }

    .branch-box {
      border-radius: 10px;
      padding: 9px;
      font-size: 0.88rem;
      border: 1px solid #c9dde4;
      background: #fff;
      color: #2b4f5e;
    }

    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 10px;
    }

    .section-head h4 {
      margin: 0 0 4px;
    }

    .section-head p {
      margin: 0;
      color: #5a7683;
    }

    .route-chip {
      border: 1px solid #c8dde5;
      border-radius: 999px;
      padding: 5px 10px;
      font-size: 0.8rem;
      color: #2f5f72;
      background: #f2f9fc;
      white-space: nowrap;
    }

    .table-wrap {
      overflow: auto;
      border: 1px solid #d6e6eb;
      border-radius: 10px;
      background: #fff;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 860px;
    }

    th, td {
      text-align: left;
      padding: 8px 10px;
      border-bottom: 1px solid #edf4f6;
      vertical-align: top;
      font-size: 0.88rem;
    }

    th {
      background: #f4fbfd;
      color: #284e5f;
      font-size: 0.83rem;
    }

    .level-tag {
      border: 1px solid #c8dce3;
      border-radius: 999px;
      padding: 2px 7px;
      font-size: 0.75rem;
      background: #f3f9fb;
      color: #2f5d70;
    }

    .how-to {
      margin: 10px 0 0;
      color: #4f6d7a;
      font-size: 0.9rem;
    }

    .json-module details {
      border: 1px solid #d5e6eb;
      border-radius: 10px;
      margin-bottom: 8px;
      background: #fbfeff;
      overflow: hidden;
    }

    .json-module summary {
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 9px 10px;
      background: #f3fafc;
      font-weight: 600;
    }

    .json-module summary code {
      font-size: 0.78rem;
      color: #20596f;
    }

    .json-details {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      padding: 10px 10px 0;
    }

    .json-details h5 {
      margin: 0 0 6px;
      font-size: 0.85rem;
      color: #244f60;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .json-details ul {
      margin: 0;
      padding-left: 16px;
      display: grid;
      gap: 4px;
    }

    pre {
      margin: 10px;
      padding: 10px;
      border-radius: 10px;
      border: 1px solid #d6e6eb;
      background: #f5fbfd;
      overflow: auto;
      font-size: 0.82rem;
    }

    .check-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .check-item {
      border: 1px solid #d4e4e9;
      border-radius: 10px;
      padding: 9px 10px;
      background: #fbfeff;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #2d5567;
      font-size: 0.9rem;
    }

    @media (max-width: 1200px) {
      .flow-track {
        grid-template-columns: repeat(1, minmax(0, 1fr));
      }

      .flow-step {
        grid-column: span 1;
      }

      .flow-arrow {
        transform: rotate(90deg);
      }
    }

    @media (max-width: 900px) {
      .hero {
        flex-direction: column;
        align-items: flex-start;
      }

      .decision-branches,
      .json-details,
      .check-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ManualUserPageComponent {
  readonly mainFlow: FlowStep[] = [
    {
      step: 'Carga de datos',
      capture: 'Archivo, hoja (si aplica), rango y delimitador',
      output: 'Vista previa lista para importar'
    },
    {
      step: 'Importar a workspace',
      capture: 'Confirmar importacion',
      output: 'Dataset activo para modulos de analisis'
    },
    {
      step: 'Workspace',
      capture: 'Filtros, busqueda, ajustes de columnas/celdas',
      output: 'Datos revisados y consistentes'
    },
    {
      step: 'Limpieza',
      capture: 'Nulos, outliers y transformaciones',
      output: 'Dataset depurado'
    },
    {
      step: 'Analisis',
      capture: 'Parametros de cada modulo (formularios o JSON)',
      output: 'Resultados e interpretacion'
    },
    {
      step: 'Reporte',
      capture: 'Formato y secciones',
      output: 'Salida PDF/XLSX'
    }
  ];

  readonly screenGuides: ScreenInputGuide[] = [
    {
      id: 'mod-data-import',
      title: 'Carga de Datos',
      route: '/data-import',
      goal: 'Subir, previsualizar e importar un archivo al workspace.',
      howTo:
        'Selecciona archivo, ajusta hoja/rango si hace falta, ejecuta "Subir y previsualizar", valida la muestra y luego usa "Importar al workspace".',
      fields: [
        { field: 'Archivo', level: 'Obligatorio', when: 'Siempre', format: '.xlsx | .xls | .csv | .txt' },
        { field: 'Hoja (sheetName)', level: 'Condicional', when: 'Solo archivos Excel', format: 'Texto (ejemplo: Sheet1)' },
        { field: 'Rango de filas (rowRange)', level: 'Opcional', when: 'Cuando quieres limitar preview', format: 'inicio:fin (ejemplo: 1:200)' },
        { field: 'Columnas seleccionadas', level: 'Opcional', when: 'Cuando quieres filtrar columnas', format: 'col1,col2,col3' },
        { field: 'Delimitador', level: 'Opcional', when: 'CSV/TXT', format: ', | ; | \\t | |' }
      ]
    },
    {
      id: 'mod-workspace',
      title: 'Workspace',
      route: '/workspace',
      goal: 'Inspeccionar datos, filtrar, ordenar y ajustar valores.',
      howTo:
        'Aplica filtros por busqueda o columna, revisa filas visibles, ajusta nombres de columna y modifica celdas si detectas inconsistencias.',
      fields: [
        { field: 'Busqueda global', level: 'Opcional', when: 'Para localizar registros', format: 'Texto libre' },
        { field: 'Columna (filtro)', level: 'Opcional', when: 'Filtro focalizado', format: 'Seleccion de lista' },
        { field: 'Valor contiene', level: 'Opcional', when: 'Filtro por columna', format: 'Texto o numero' },
        { field: 'Solo filas con nulos', level: 'Opcional', when: 'Depuracion de calidad', format: 'Checkbox' },
        { field: 'Nombre de columna', level: 'Opcional', when: 'Renombrado manual', format: 'Texto' },
        { field: 'Valor de celda', level: 'Opcional', when: 'Correccion puntual', format: 'Texto | numero | booleano' }
      ]
    },
    {
      id: 'mod-cleaning',
      title: 'Limpieza',
      route: '/cleaning',
      goal: 'Aplicar tratamiento de faltantes, outliers y transformaciones.',
      howTo:
        'Ejecuta primero faltantes, luego outliers y finalmente transformaciones. Revisa en Workspace despues de cada accion.',
      fields: [
        { field: 'Columna (faltantes)', level: 'Opcional', when: 'Si estrategia se limita a una columna', format: 'Seleccion de lista' },
        { field: 'Estrategia de faltantes', level: 'Obligatorio', when: 'Siempre', format: 'drop-rows | fill-value' },
        { field: 'Valor de reemplazo', level: 'Condicional', when: 'Solo si estrategia = fill-value', format: 'Texto | numero' },
        { field: 'Columna numerica (outliers)', level: 'Obligatorio', when: 'Siempre en panel outliers', format: 'Seleccion de lista' },
        { field: 'Umbral Z-score', level: 'Obligatorio', when: 'Siempre en panel outliers', format: 'Numero (ejemplo: 3)' },
        { field: 'Accion de outliers', level: 'Obligatorio', when: 'Siempre en panel outliers', format: 'mark | remove' },
        { field: 'Transformacion', level: 'Obligatorio', when: 'Siempre en panel transformacion', format: 'log | sqrt | box-cox | normalize-columns' },
        { field: 'Columna objetivo', level: 'Condicional', when: 'No aplica si transformacion = normalize-columns', format: 'Seleccion de lista' }
      ]
    },
    {
      id: 'mod-descriptive',
      title: 'Descriptiva',
      route: '/descriptive',
      goal: 'Calcular estadisticas descriptivas por columnas.',
      howTo:
        'Ingresa columnas separadas por coma y percentiles numericos. Luego ejecuta y valida tabla de salida.',
      fields: [
        { field: 'Columnas', level: 'Obligatorio', when: 'Siempre', format: 'col1,col2,col3' },
        { field: 'Percentiles', level: 'Obligatorio', when: 'Siempre', format: '25,50,75,90' }
      ]
    },
    {
      id: 'mod-visualization',
      title: 'Visualizacion',
      route: '/visualization',
      goal: 'Generar graficas a partir de columnas seleccionadas.',
      howTo:
        'Selecciona tipo de grafica, define ejes y titulo, ejecuta y revisa vista previa. Exporta JSON si lo necesitas.',
      fields: [
        { field: 'Tipo de grafica', level: 'Obligatorio', when: 'Siempre', format: 'histogram | boxplot | scatter | line | pareto | heatmap' },
        { field: 'Eje X', level: 'Obligatorio', when: 'Siempre', format: 'Nombre de columna' },
        { field: 'Eje Y', level: 'Obligatorio', when: 'Siempre', format: 'Nombre de columna' },
        { field: 'Titulo', level: 'Obligatorio', when: 'Siempre', format: 'Texto' }
      ]
    },
    {
      id: 'mod-reports',
      title: 'Reportes',
      route: '/reports',
      goal: 'Exportar resultados consolidados.',
      howTo:
        'Define titulo, formato y secciones activas. Ejecuta exportacion y confirma artefacto generado.',
      fields: [
        { field: 'Titulo de reporte', level: 'Obligatorio', when: 'Siempre', format: 'Texto' },
        { field: 'Formato', level: 'Obligatorio', when: 'Siempre', format: 'pdf | xlsx' },
        { field: 'Secciones', level: 'Opcional', when: 'Seleccion de contenido a incluir', format: 'Checkbox por seccion' }
      ]
    }
  ];

  readonly jsonModules: JsonModuleGuide[] = [
    {
      module: 'Inferencia',
      route: '/inference',
      analyses: [
        {
          analysis: 'Intervalo de confianza',
          endpoint: '/inference/confidence-interval',
          required: ['dataset_id', 'column'],
          optional: ['alpha (default: 0.05)'],
          sample: '{\n  "dataset_id": "<dataset_id>",\n  "column": "temperature",\n  "alpha": 0.05\n}'
        },
        {
          analysis: 'Prueba t (una muestra)',
          endpoint: '/inference/ttest-one-sample',
          required: ['dataset_id', 'column', 'population_mean'],
          optional: ['alpha (default: 0.05)'],
          sample: '{\n  "dataset_id": "<dataset_id>",\n  "column": "temperature",\n  "population_mean": 0,\n  "alpha": 0.05\n}'
        },
        {
          analysis: 'ANOVA',
          endpoint: '/inference/anova',
          required: ['dataset_id', 'column', 'group_column'],
          optional: ['alpha (default: 0.05)'],
          sample: '{\n  "dataset_id": "<dataset_id>",\n  "column": "yield",\n  "group_column": "line",\n  "alpha": 0.05\n}'
        },
        {
          analysis: 'Chi-cuadrada',
          endpoint: '/inference/chi-square',
          required: ['dataset_id', 'column_a', 'column_b'],
          optional: ['alpha (default: 0.05)'],
          sample: '{\n  "dataset_id": "<dataset_id>",\n  "column_a": "shift",\n  "column_b": "defect_type",\n  "alpha": 0.05\n}'
        },
        {
          analysis: 'No parametrica',
          endpoint: '/inference/non-parametric',
          required: ['dataset_id', 'test', 'column'],
          optional: ['group_column', 'group_a', 'group_b', 'alpha (default: 0.05)'],
          sample: '{\n  "dataset_id": "<dataset_id>",\n  "test": "mannwhitney",\n  "column": "temperature",\n  "group_column": "machine",\n  "group_a": "A",\n  "group_b": "B",\n  "alpha": 0.05\n}'
        },
        {
          analysis: 'Comparacion de medias (t dos muestras)',
          endpoint: '/inference/ttest-two-sample',
          required: ['dataset_id', 'dataset2_id', 'column1', 'column2'],
          optional: ['equal_var (default: false)', 'alpha (default: 0.05)'],
          sample: '{\n  "dataset_id": "<dataset_id_1>",\n  "dataset2_id": "<dataset_id_2>",\n  "column1": "yield",\n  "column2": "yield",\n  "equal_var": false,\n  "alpha": 0.05\n}'
        }
      ]
    },
    {
      module: 'Regresion',
      route: '/regression',
      analyses: [
        {
          analysis: 'Regresion lineal simple / multiple',
          endpoint: '/regression/linear o /regression/multiple',
          required: ['dataset_id', 'target', 'features'],
          optional: [],
          sample: '{\n  "dataset_id": "<dataset_id>",\n  "target": "defects",\n  "features": ["temperature", "pressure"]\n}'
        },
        {
          analysis: 'Modelo polinomial',
          endpoint: '/regression/polynomial',
          required: ['dataset_id', 'target', 'features'],
          optional: ['degree (default: 2)'],
          sample: '{\n  "dataset_id": "<dataset_id>",\n  "target": "defects",\n  "features": ["temperature"],\n  "degree": 3\n}'
        },
        {
          analysis: 'Regresion logistica',
          endpoint: '/regression/logistic',
          required: ['dataset_id', 'target', 'features'],
          optional: ['threshold (default: 0.5)'],
          sample: '{\n  "dataset_id": "<dataset_id>",\n  "target": "is_defective",\n  "features": ["temperature", "pressure"],\n  "threshold": 0.5\n}'
        },
        {
          analysis: 'Correlacion',
          endpoint: '/regression/correlation',
          required: ['dataset_id', 'columns'],
          optional: ['method (pearson|spearman|kendall)'],
          sample: '{\n  "dataset_id": "<dataset_id>",\n  "columns": ["temperature", "pressure", "defects"],\n  "method": "pearson"\n}'
        }
      ]
    },
    {
      module: 'DOE',
      route: '/doe',
      analyses: [
        {
          analysis: 'Diseno factorial',
          endpoint: '/doe/factorial',
          required: ['factors'],
          optional: [],
          sample: '{\n  "factors": {\n    "temperature": [180, 200],\n    "pressure": [10, 20]\n  }\n}'
        },
        {
          analysis: 'Diseno fraccional',
          endpoint: '/doe/fractional',
          required: ['factors'],
          optional: ['fraction (default: 2)'],
          sample: '{\n  "factors": {\n    "temperature": [180, 200],\n    "pressure": [10, 20]\n  },\n  "fraction": 2\n}'
        },
        {
          analysis: 'Superficie de respuesta',
          endpoint: '/doe/response-surface',
          required: ['factors'],
          optional: ['center_points (default: 2)'],
          sample: '{\n  "factors": {\n    "temperature": [150, 250],\n    "pressure": [5, 30]\n  },\n  "center_points": 2\n}'
        },
        {
          analysis: 'Efectos',
          endpoint: '/doe/effects',
          required: ['matrix', 'response'],
          optional: [],
          sample: '{\n  "matrix": [\n    {"temperature": 180, "pressure": 10},\n    {"temperature": 200, "pressure": 20}\n  ],\n  "response": [14.2, 16.8]\n}'
        }
      ]
    },
    {
      module: 'SPC',
      route: '/spc',
      analyses: [
        {
          analysis: 'Carta X-barra / R / p / np / c / u',
          endpoint: '/spc/xbar-r, /spc/p, /spc/np, /spc/c, /spc/u',
          required: ['dataset_id', 'column'],
          optional: ['subgroup_size (default: 5)'],
          sample: '{\n  "dataset_id": "<dataset_id>",\n  "column": "diameter",\n  "subgroup_size": 5\n}'
        },
        {
          analysis: 'Capacidad de proceso',
          endpoint: '/spc/capability',
          required: ['dataset_id', 'column', 'lsl', 'usl'],
          optional: [],
          sample: '{\n  "dataset_id": "<dataset_id>",\n  "column": "diameter",\n  "lsl": 9.5,\n  "usl": 10.5\n}'
        }
      ]
    },
    {
      module: 'Calidad',
      route: '/quality',
      analyses: [
        {
          analysis: 'Pareto',
          endpoint: '/quality/pareto',
          required: ['dataset_id', 'category_column'],
          optional: ['value_column'],
          sample: '{\n  "dataset_id": "<dataset_id>",\n  "category_column": "defect_type",\n  "value_column": "count"\n}'
        },
        {
          analysis: 'Clasificacion de defectos',
          endpoint: '/quality/defects-grouping',
          required: ['dataset_id', 'category_column'],
          optional: [],
          sample: '{\n  "dataset_id": "<dataset_id>",\n  "category_column": "defect_type"\n}'
        },
        {
          analysis: 'Causa raiz',
          endpoint: '/quality/root-cause',
          required: ['problem', 'categories'],
          optional: [],
          sample: '{\n  "problem": "Aumento de defectos",\n  "categories": {\n    "Metodo": ["Instruccion incompleta"],\n    "Maquina": ["Descalibrada"]\n  }\n}'
        }
      ]
    },
    {
      module: 'Series de Tiempo',
      route: '/time-series',
      analyses: [
        {
          analysis: 'Descomposicion',
          endpoint: '/timeseries/decomposition',
          required: ['dataset_id', 'date_column', 'value_column'],
          optional: ['frequency (default: D)'],
          sample: '{\n  "dataset_id": "<dataset_id>",\n  "date_column": "date",\n  "value_column": "sales",\n  "frequency": "D"\n}'
        },
        {
          analysis: 'Suavizamiento / Pronostico',
          endpoint: '/timeseries/exponential-smoothing o /timeseries/forecast',
          required: ['dataset_id', 'date_column', 'value_column'],
          optional: ['frequency (default: D)', 'periods (default: 12)'],
          sample: '{\n  "dataset_id": "<dataset_id>",\n  "date_column": "date",\n  "value_column": "sales",\n  "frequency": "D",\n  "periods": 12\n}'
        },
        {
          analysis: 'ARIMA',
          endpoint: '/timeseries/arima',
          required: ['dataset_id', 'date_column', 'value_column'],
          optional: ['frequency (default: D)', 'periods (default: 12)', 'p (default: 1)', 'd (default: 1)', 'q (default: 1)'],
          sample: '{\n  "dataset_id": "<dataset_id>",\n  "date_column": "date",\n  "value_column": "sales",\n  "frequency": "D",\n  "periods": 12,\n  "p": 1,\n  "d": 1,\n  "q": 1\n}'
        }
      ]
    },
    {
      module: 'Multivariada',
      route: '/multivariate',
      analyses: [
        {
          analysis: 'PCA',
          endpoint: '/multivariate/pca',
          required: ['dataset_id', 'columns'],
          optional: ['n_components'],
          sample: '{\n  "dataset_id": "<dataset_id>",\n  "columns": ["temperature", "pressure", "humidity"],\n  "n_components": 2\n}'
        },
        {
          analysis: 'Clustering',
          endpoint: '/multivariate/clustering',
          required: ['dataset_id', 'columns'],
          optional: ['n_clusters (default: 3)'],
          sample: '{\n  "dataset_id": "<dataset_id>",\n  "columns": ["temperature", "pressure"],\n  "n_clusters": 3\n}'
        },
        {
          analysis: 'Discriminante',
          endpoint: '/multivariate/discriminant',
          required: ['dataset_id', 'columns', 'target_column'],
          optional: [],
          sample: '{\n  "dataset_id": "<dataset_id>",\n  "columns": ["temperature", "pressure"],\n  "target_column": "segment"\n}'
        }
      ]
    },
    {
      module: 'Automatizacion',
      route: '/automation',
      analyses: [
        {
          analysis: 'Guardar configuracion',
          endpoint: '/automation/configurations',
          required: ['name', 'analysis_type', 'configuration'],
          optional: [],
          sample: '{\n  "name": "Inferencia lote A",\n  "analysis_type": "Prueba t",\n  "configuration": {\n    "column": "temperature",\n    "population_mean": 0,\n    "alpha": 0.05\n  }\n}'
        },
        {
          analysis: 'Registrar re-ejecucion',
          endpoint: '/automation/executions',
          required: ['dataset_id', 'analysis_type'],
          optional: ['configuration', 'result'],
          sample: '{\n  "dataset_id": "<dataset_id>",\n  "analysis_type": "Prueba t",\n  "configuration": {\n    "column": "temperature",\n    "population_mean": 0,\n    "alpha": 0.05\n  }\n}'
        },
        {
          analysis: 'Consultar historial',
          endpoint: '/automation/executions',
          required: [],
          optional: ['dataset_id (query)'],
          sample: '{\n  "dataset_id": "<dataset_id_opcional>"\n}'
        }
      ]
    }
  ];
}
