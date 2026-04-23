import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { WorkspaceStore } from '../../../core/services/workspace.store';
import { VisualizationApiService } from '../../../infrastructure/http/visualization-api.service';
import { ChartSeriesPoint, ChartType } from '../../../shared/models/chart.model';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';
import { LoadingIndicatorComponent } from '../../../shared/ui/loading-indicator/loading-indicator.component';

interface BarRender {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-visualization-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingIndicatorComponent, ErrorMessageComponent],
  template: `
    <section class="page">
      <header class="page-header">
        <h2>5. Visualización de Datos</h2>
        <p>Histogramas, boxplots, dispersión, líneas, pareto y heatmaps con configuración dinámica.</p>
      </header>

      <div *ngIf="store.activeDataset(); else noDataset" class="page-grid">
        <article class="card span-4">
          <h3>Panel de configuración</h3>
          <form class="form-grid" [formGroup]="form" (ngSubmit)="generate()">
            <label>
              <span>Tipo de gráfica</span>
              <select formControlName="type">
                <option value="histogram">Histograma</option>
                <option value="boxplot">Boxplot</option>
                <option value="scatter">Dispersión</option>
                <option value="line">Líneas</option>
                <option value="pareto">Pareto</option>
                <option value="heatmap">Heatmap</option>
              </select>
            </label>
            <label>
              <span>Eje X</span>
              <select formControlName="xColumn">
                <option *ngFor="let column of columns()" [value]="column">{{ column }}</option>
              </select>
            </label>
            <label>
              <span>Eje Y</span>
              <select formControlName="yColumn">
                <option *ngFor="let column of columns()" [value]="column">{{ column }}</option>
              </select>
            </label>
            <label>
              <span>Título</span>
              <input formControlName="title" />
            </label>
            <button class="primary" type="submit" [disabled]="form.invalid || loading()">Generar</button>
            <button class="secondary" type="button" (click)="exportChart()" [disabled]="!hasChart()">Exportar gráfica</button>
          </form>
        </article>

        <article class="card span-8">
          <h3>Vista previa</h3>
          <app-loading-indicator [show]="loading()" [label]="'Generando gráfica...'" />
          <app-error-message [message]="error()" />

          <div *ngIf="hasChart(); else emptyChart" class="chart-wrap">
            <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" preserveAspectRatio="xMidYMid meet">
              <line [attr.x1]="padding" [attr.y1]="height-padding" [attr.x2]="width-padding" [attr.y2]="height-padding" class="axis" />
              <line [attr.x1]="padding" [attr.y1]="padding" [attr.x2]="padding" [attr.y2]="height-padding" class="axis" />

              <ng-container [ngSwitch]="chartType()">
                <ng-container *ngSwitchCase="'line'">
                  <polyline [attr.points]="linePoints()" class="line" />
                </ng-container>

                <ng-container *ngSwitchCase="'scatter'">
                  <circle *ngFor="let point of normalizedPoints()" [attr.cx]="point.x" [attr.cy]="point.y" r="4" class="scatter" />
                </ng-container>

                <ng-container *ngSwitchCase="'boxplot'">
                  <rect [attr.x]="boxPlot().x" [attr.y]="boxPlot().q3" [attr.width]="boxPlot().width" [attr.height]="boxPlot().height" class="box" />
                  <line [attr.x1]="boxPlot().x" [attr.y1]="boxPlot().median" [attr.x2]="boxPlot().x + boxPlot().width" [attr.y2]="boxPlot().median" class="median" />
                  <line [attr.x1]="boxPlot().midX" [attr.y1]="boxPlot().min" [attr.x2]="boxPlot().midX" [attr.y2]="boxPlot().q3" class="whisker" />
                  <line [attr.x1]="boxPlot().midX" [attr.y1]="boxPlot().max" [attr.x2]="boxPlot().midX" [attr.y2]="boxPlot().q1" class="whisker" />
                </ng-container>

                <ng-container *ngSwitchCase="'heatmap'">
                  <rect
                    *ngFor="let cell of heatmapCells()"
                    [attr.x]="cell.x"
                    [attr.y]="cell.y"
                    [attr.width]="cell.size"
                    [attr.height]="cell.size"
                    [attr.fill]="cell.color"
                  />
                </ng-container>

                <ng-container *ngSwitchDefault>
                  <rect
                    *ngFor="let bar of bars()"
                    [attr.x]="bar.x"
                    [attr.y]="bar.y"
                    [attr.width]="bar.width"
                    [attr.height]="bar.height"
                    class="bar"
                  />
                </ng-container>
              </ng-container>
            </svg>
          </div>

          <ng-template #emptyChart>
            <div class="empty-state">Aún no hay gráfica. Configura y ejecuta para visualizar.</div>
          </ng-template>
        </article>
      </div>

      <ng-template #noDataset>
        <article class="empty-state">
          Importa un dataset primero en <a routerLink="/data-import">Carga de Datos</a>.
        </article>
      </ng-template>
    </section>
  `,
  styles: [`
    .chart-wrap {
      border: 1px solid #d8e6ea;
      border-radius: 12px;
      padding: 6px;
      background: #fbfeff;
    }
    svg {
      width: 100%;
      height: auto;
      display: block;
    }
    .axis { stroke: #86a1ab; stroke-width: 1.1; }
    .line { fill: none; stroke: #0f6f89; stroke-width: 2.4; }
    .scatter { fill: #1f8b63; opacity: 0.8; }
    .bar { fill: #1a7d9a; opacity: 0.88; }
    .box { fill: rgba(20, 131, 167, 0.3); stroke: #1483a7; }
    .median { stroke: #0f5668; stroke-width: 2.2; }
    .whisker { stroke: #0f5668; stroke-width: 1.4; }
  `]
})
export class VisualizationPageComponent {
  readonly store = inject(WorkspaceStore);
  private readonly visualizationApi = inject(VisualizationApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly chartResult = signal<{ type: ChartType; points: ChartSeriesPoint[]; title: string } | null>(null);

  readonly width = 760;
  readonly height = 340;
  readonly padding = 42;

  readonly columns = computed(() => this.store.activeDataset()?.columns.map((column) => column.key) ?? []);
  readonly hasChart = computed(() => this.chartResult() !== null);
  readonly chartType = computed<ChartType>(() => this.chartResult()?.type ?? 'line');

  readonly form = new FormGroup({
    type: new FormControl<ChartType>('histogram', { nonNullable: true, validators: Validators.required }),
    xColumn: new FormControl('temperature', { nonNullable: true, validators: Validators.required }),
    yColumn: new FormControl('pressure', { nonNullable: true, validators: Validators.required }),
    title: new FormControl('Vista Analítica', { nonNullable: true, validators: Validators.required })
  });

  constructor() {
    effect(() => {
      const availableColumns = this.columns();
      if (availableColumns.length === 0) {
        return;
      }
      const currentX = this.form.controls.xColumn.value;
      const currentY = this.form.controls.yColumn.value;

      if (!availableColumns.includes(currentX)) {
        this.form.controls.xColumn.setValue(availableColumns[0]);
      }
      if (!availableColumns.includes(currentY)) {
        this.form.controls.yColumn.setValue(availableColumns[1] ?? availableColumns[0]);
      }
    });
  }

  generate(): void {
    const dataset = this.store.activeDataset();
    if (!dataset) {
      this.error.set('No hay dataset cargado.');
      return;
    }

    const payload = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    this.visualizationApi.generateChart({
      datasetId: dataset.id,
      type: payload.type,
      xColumn: payload.xColumn,
      yColumn: payload.yColumn,
      title: payload.title
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (chart) => {
          const points = chart.series[0]?.points ?? [];
          this.chartResult.set({ type: chart.type, points, title: chart.title });
        },
        error: (error: Error) => this.error.set(error.message)
      });
  }

  normalizedPoints(): Array<{ x: number; y: number }> {
    const points = this.chartResult()?.points ?? [];
    if (points.length === 0) {
      return [];
    }
    const numericX = points.map((point, index) => typeof point.x === 'number' ? point.x : index);
    const numericY = points.map((point) => Number(point.y));

    const minX = Math.min(...numericX);
    const maxX = Math.max(...numericX);
    const minY = Math.min(...numericY);
    const maxY = Math.max(...numericY);

    return points.map((point, index) => {
      const x = typeof point.x === 'number' ? point.x : index;
      const y = Number(point.y);
      const scaledX = this.scale(x, minX, maxX, this.padding, this.width - this.padding);
      const scaledY = this.scale(y, minY, maxY, this.height - this.padding, this.padding);
      return { x: scaledX, y: scaledY };
    });
  }

  linePoints(): string {
    return this.normalizedPoints().map((point) => `${point.x},${point.y}`).join(' ');
  }

  bars(): BarRender[] {
    const points = this.chartResult()?.points ?? [];
    if (points.length === 0) {
      return [];
    }
    const values = points.map((point) => Number(point.y));
    const max = Math.max(...values, 1);
    const plotWidth = this.width - this.padding * 2;
    const width = plotWidth / points.length;
    return values.map((value, index) => {
      const height = (value / max) * (this.height - this.padding * 2);
      return {
        x: this.padding + index * width + 1,
        y: this.height - this.padding - height,
        width: Math.max(width - 2, 1),
        height
      };
    });
  }

  heatmapCells(): Array<{ x: number; y: number; size: number; color: string }> {
    const points = this.chartResult()?.points ?? [];
    if (points.length === 0) {
      return [];
    }
    const side = Math.ceil(Math.sqrt(points.length));
    const cell = Math.floor((this.width - this.padding * 2) / side);
    const max = Math.max(...points.map((point) => point.y), 1);
    return points.map((point, index) => {
      const row = Math.floor(index / side);
      const col = index % side;
      const alpha = Math.max(0.15, Number(point.y) / max);
      return {
        x: this.padding + col * cell,
        y: this.padding + row * cell,
        size: cell - 2,
        color: `rgba(15, 111, 137, ${alpha.toFixed(2)})`
      };
    });
  }

  boxPlot(): { x: number; width: number; min: number; q1: number; median: number; q3: number; max: number; height: number; midX: number } {
    const values = (this.chartResult()?.points ?? []).map((point) => Number(point.y)).filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
    if (values.length === 0) {
      return { x: 0, width: 0, min: 0, q1: 0, median: 0, q3: 0, max: 0, height: 0, midX: 0 };
    }

    const min = values[0];
    const max = values[values.length - 1];
    const q1 = this.quantile(values, 0.25);
    const median = this.quantile(values, 0.5);
    const q3 = this.quantile(values, 0.75);

    const x = this.width * 0.35;
    const width = this.width * 0.3;

    const scaledMin = this.scale(min, min, max, this.height - this.padding, this.padding);
    const scaledQ1 = this.scale(q1, min, max, this.height - this.padding, this.padding);
    const scaledMedian = this.scale(median, min, max, this.height - this.padding, this.padding);
    const scaledQ3 = this.scale(q3, min, max, this.height - this.padding, this.padding);
    const scaledMax = this.scale(max, min, max, this.height - this.padding, this.padding);

    return {
      x,
      width,
      min: scaledMin,
      q1: scaledQ1,
      median: scaledMedian,
      q3: scaledQ3,
      max: scaledMax,
      height: scaledQ1 - scaledQ3,
      midX: x + width / 2
    };
  }

  exportChart(): void {
    const chart = this.chartResult();
    if (!chart) {
      return;
    }
    const blob = new Blob([JSON.stringify(chart, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${chart.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private quantile(sorted: number[], q: number): number {
    const index = (sorted.length - 1) * q;
    const low = Math.floor(index);
    const high = Math.ceil(index);
    if (low === high) {
      return sorted[low];
    }
    const weight = index - low;
    return sorted[low] * (1 - weight) + sorted[high] * weight;
  }

  private scale(value: number, min: number, max: number, outputMin: number, outputMax: number): number {
    if (max === min) {
      return (outputMin + outputMax) / 2;
    }
    return outputMin + ((value - min) * (outputMax - outputMin)) / (max - min);
  }
}
