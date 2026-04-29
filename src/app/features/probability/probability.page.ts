import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  type CapabilityResult,
  capability,
  descriptiveStats,
  formatFloat,
  isNumberText,
  normalityTest,
  parseOptionalFloat,
  type DescriptiveStats
} from './maxitab.analytics';
import { startGuidedTour, type TourStep } from '../../shared/driver-tour';

type TabKey = 'hist' | 'data' | 'preview' | 'summary' | 'output';
type GroupMode = 'Ninguno' | 'Superpuesto';
type BinsMode = 'auto' | 'manual';
type HistScale = 'Densidad' | 'Porcentaje' | 'Probabilidad';
type ClassMethod = 'cutpoint' | 'midpoint';

interface HistogramDataset {
  label: string | null;
  values: number[];
  color: string;
}

interface HistogramModel {
  datasets: HistogramDataset[];
  allValues: number[];
  variableLabel: string;
  bins: number | 'auto';
  classMethod: ClassMethod;
  scale: HistScale;
  discrete: boolean;
  showStats: boolean;
  showFit: boolean;
  showKde: boolean;
  showLimits: boolean;
  lsl: number | null;
  usl: number | null;
  target: number | null;
  stats: DescriptiveStats | null;
}

interface SummaryRow {
  variable: string;
  n: string;
  mean: string;
  variance: string;
  std: string;
  mode: string;
  min: string;
  q1: string;
  median: string;
  q3: string;
  iqr: string;
  max: string;
}

@Component({
  selector: 'app-probability-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './probability.page.html',
  styleUrl: './probability.page.scss'
})
export class ProbabilityPageComponent implements AfterViewInit {
  @ViewChild('histCanvas') private readonly histCanvas?: ElementRef<HTMLCanvasElement>;

  readonly allTabs: { key: TabKey; label: string }[] = [
    { key: 'hist', label: 'Histograma' },
    { key: 'data', label: 'Datos' },
    { key: 'preview', label: 'Vista previa' },
    { key: 'summary', label: 'Resumen columnas' },
    { key: 'output', label: 'Salida' }
  ];

  activeTab: TabKey = 'data';
  sidebarExpanded = true;
  statusMessage = 'Listo';
  errorMessage: string | null = null;

  columnNames: string[] = ['C1', 'C2', 'C3'];
  rows: string[][] = this.createEmptyRows(20, 3);
  previewRows: string[][] = [];
  summaryRows: SummaryRow[] = [];

  varName = 'C1';
  groupBy = '(Ninguno)';
  groupMode: GroupMode = 'Ninguno';

  lslText = '';
  uslText = '';
  targetText = '';

  binsMode: BinsMode = 'auto';
  binsManualText = '20';
  classMethod: ClassMethod = 'cutpoint';
  scale: HistScale = 'Densidad';

  showStats = true;
  showFit = true;
  showKde = false;
  discrete = false;
  showLimits = true;

  outputText = 'MaxiTab listo. Captura datos directamente en la tabla.';

  private histogramModel: HistogramModel | null = null;
  private readonly colorPalette = ['#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];

  constructor() {
    this.refreshColumnControls();
  }

  ngAfterViewInit(): void {
    this.queueDraw();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.activeTab === 'hist') {
      this.queueDraw();
    }
  }

  switchTab(tab: TabKey): void {
    this.activeTab = tab;
    if (tab === 'hist') {
      this.queueDraw();
    }
  }

  toggleSidebar(): void {
    this.sidebarExpanded = !this.sidebarExpanded;
    this.statusMessage = this.sidebarExpanded ? 'Panel expandido' : 'Panel minimizado';
  }

  async startTutorial(): Promise<void> {
    if (!this.sidebarExpanded) {
      this.sidebarExpanded = true;
    }
    this.switchTab('data');

    const steps: TourStep[] = [
      {
        element: '[data-tour="studio-header"]',
        popover: {
          title: 'MaxiTab Studio',
          description: 'Esta barra concentra acciones rápidas para navegar, generar y exportar resultados.'
        }
      },
      {
        element: '[data-tour="studio-generate-header"]',
        popover: {
          title: 'Generar histograma',
          description: 'Después de capturar datos y configurar parámetros, usa este botón para calcular y graficar.'
        }
      },
      {
        element: '[data-tour="studio-data-selection"]',
        popover: {
          title: 'Selección de datos',
          description: 'Define qué columna analizar y, si aplica, la columna para agrupar resultados superpuestos.'
        }
      },
      {
        element: '[data-tour="studio-spec-limits"]',
        popover: {
          title: 'LSL, USL y Target',
          description: 'Estos límites alimentan el análisis de capacidad (Cp, Cpk) y las líneas de referencia del histograma.'
        }
      },
      {
        element: '[data-tour="studio-hist-settings"]',
        popover: {
          title: 'Parámetros de histograma',
          description: 'Configura bins, escala, ajuste normal, KDE y opciones visuales antes de generar la gráfica.'
        }
      },
      {
        element: '[data-tour="studio-analysis-actions"]',
        popover: {
          title: 'Análisis estadístico',
          description: 'Ejecuta descriptivos, normalidad y capacidad sin salir del módulo.'
        }
      },
      {
        element: '[data-tour="studio-data-grid"]',
        popover: {
          title: 'Tabla de captura',
          description: 'Aquí ingresas o importas CSV. Puedes agregar/quitar filas y columnas según el ejercicio.'
        }
      },
      {
        element: '[data-tour="studio-tabs"]',
        popover: {
          title: 'Pestañas',
          description: 'Alterna entre Histograma, Datos, Vista previa, Resumen y Salida textual.'
        }
      },
      {
        element: '[data-tour="studio-status-bar"]',
        popover: {
          title: 'Estado del proceso',
          description: 'Muestra mensajes de operación y alertas para validar si la corrida fue correcta.'
        }
      }
    ];

    await startGuidedTour(steps);
  }

  addRow(): void {
    this.rows.push(this.createEmptyRow(this.columnNames.length));
    this.refreshViews();
  }

  removeRow(): void {
    if (this.rows.length === 0) {
      return;
    }
    this.rows.pop();
    this.refreshViews();
  }

  addColumn(): void {
    const newName = `C${this.columnNames.length + 1}`;
    this.columnNames.push(newName);
    for (const row of this.rows) {
      row.push('');
    }
    this.refreshColumnControls();
  }

  removeColumn(): void {
    if (this.columnNames.length <= 1) {
      return;
    }
    this.columnNames.pop();
    for (const row of this.rows) {
      row.pop();
    }
    this.refreshColumnControls();
  }

  clearValues(): void {
    this.rows = this.rows.map(() => this.createEmptyRow(this.columnNames.length));
    this.refreshViews();
  }

  updateColumnName(index: number, value: string): void {
    if (index < 0 || index >= this.columnNames.length) {
      return;
    }
    const trimmed = value.trim();
    this.columnNames[index] = trimmed || `C${index + 1}`;
    this.refreshColumnControls();
  }

  onCellInput(event: Event, rowIndex: number, colIndex: number): void {
    const target = event.target as HTMLInputElement | null;
    this.updateCell(rowIndex, colIndex, target?.value ?? '');
  }

  cellValue(rowIndex: number, colIndex: number): string {
    return this.rows[rowIndex]?.[colIndex] ?? '';
  }

  async onCsvSelected(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0];
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const parsed = this.parseCsv(text);
      if (parsed.length === 0) {
        this.showWarning('El CSV esta vacio.');
        return;
      }
      const header = parsed[0];
      const hasHeader = header.some((cell) => cell.trim() && !isNumberText(cell));
      const cols = hasHeader
        ? header.map((cell, index) => cell.trim() || `C${index + 1}`)
        : Array.from({ length: header.length }, (_, index) => `C${index + 1}`);
      const dataRows = hasHeader ? parsed.slice(1) : parsed;
      this.columnNames = cols;
      this.rows = dataRows.map((row) => this.normalizeRow(row, cols.length));
      while (this.rows.length < 20) {
        this.rows.push(this.createEmptyRow(cols.length));
      }
      this.refreshColumnControls();
      this.appendOutput(`Archivo cargado: ${file.name}`);
      this.statusMessage = `CSV cargado (${file.name})`;
      this.errorMessage = null;
    } catch (error) {
      this.showError(this.errorToMessage(error));
    } finally {
      if (target) {
        target.value = '';
      }
    }
  }

  saveCsv(): void {
    try {
      const lines: string[] = [];
      lines.push(this.columnNames.map((cell) => this.csvEscape(cell)).join(','));
      for (const row of this.rows) {
        lines.push(this.normalizeRow(row, this.columnNames.length).map((cell) => this.csvEscape(cell)).join(','));
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'maxitab-data.csv';
      anchor.click();
      URL.revokeObjectURL(url);
      this.appendOutput('Datos guardados en: maxitab-data.csv');
      this.statusMessage = 'CSV exportado';
      this.errorMessage = null;
    } catch (error) {
      this.showError(this.errorToMessage(error));
    }
  }

  generateHistogram(): void {
    const current = this.currentData();
    if (current.error) {
      this.showWarning(current.error);
      return;
    }
    let bins: number | 'auto';
    let classMethod: ClassMethod;
    let lsl: number | null;
    let usl: number | null;
    let target: number | null;
    try {
      const params = this.histParams();
      bins = params.bins;
      classMethod = params.classMethod;
      lsl = params.lsl;
      usl = params.usl;
      target = params.target;
    } catch (error) {
      this.showError(this.errorToMessage(error));
      return;
    }

    const datasets: HistogramDataset[] = [];
    if (current.grouped) {
      let colorIndex = 0;
      for (const [group, values] of Object.entries(current.grouped)) {
        datasets.push({
          label: group,
          values,
          color: this.colorPalette[colorIndex % this.colorPalette.length]
        });
        colorIndex += 1;
      }
    } else if (current.values) {
      datasets.push({
        label: null,
        values: current.values,
        color: this.colorPalette[0]
      });
    }

    const allValues = current.grouped
      ? Object.values(current.grouped).flatMap((values) => values)
      : (current.values ?? []);

    const stats = descriptiveStats(allValues);
    this.histogramModel = {
      datasets,
      allValues,
      variableLabel: this.varName,
      bins,
      classMethod,
      scale: this.scale,
      discrete: this.discrete,
      showStats: this.showStats,
      showFit: this.showFit,
      showKde: this.showKde,
      showLimits: this.showLimits,
      lsl,
      usl,
      target,
      stats
    };

    this.switchTab('hist');
    this.runDescriptive(false, false);
    this.runNormality(true, false);
    this.runCapability(true, false);
    this.refreshViews();
    this.statusMessage = 'Histograma generado';
    this.errorMessage = null;
  }

  exportHistogram(): void {
    if (!this.histogramModel) {
      this.showWarning('Primero genera un histograma.');
      return;
    }
    this.queueDraw();
    const canvas = this.histCanvas?.nativeElement;
    if (!canvas) {
      this.showWarning('No se encontro el canvas de histograma.');
      return;
    }
    const url = canvas.toDataURL('image/png');
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'histograma.png';
    anchor.click();
    this.appendOutput('Histograma exportado: histograma.png');
    this.statusMessage = 'Histograma exportado';
    this.errorMessage = null;
  }

  onRunDescriptive(): void {
    this.runDescriptive(false, true);
  }

  onRunNormality(): void {
    this.runNormality(false, true);
  }

  onRunCapability(): void {
    this.runCapability(false, true);
  }

  formatValue(value: number | null | undefined): string {
    return formatFloat(value);
  }

  formatAny(value: number | string): string {
    return typeof value === 'number' ? formatFloat(value) : value;
  }

  private runDescriptive(append = false, focus = true): void {
    const current = this.currentData();
    if (current.error) {
      if (!append) {
        this.showWarning(current.error);
      }
      return;
    }
    const blocks: string[] = [];
    if (current.grouped) {
      for (const [group, values] of Object.entries(current.grouped)) {
        const stats = descriptiveStats(values);
        if (stats) {
          blocks.push(this.formatDescriptiveBlock(`${this.varName} [${group}]`, stats));
        }
      }
    } else if (current.values) {
      const stats = descriptiveStats(current.values);
      if (stats) {
        blocks.push(this.formatDescriptiveBlock(this.varName, stats));
      }
    }
    const text = blocks.join('\n\n');
    if (append) {
      this.appendOutput(text, focus);
      return;
    }
    this.setOutput(text, focus);
  }

  private runNormality(append = false, focus = true): void {
    const current = this.currentData();
    if (current.error) {
      if (!append) {
        this.showWarning(current.error);
      }
      return;
    }
    const alpha = 0.05;
    const blocks: string[] = [];
    if (current.grouped) {
      for (const [group, values] of Object.entries(current.grouped)) {
        const normality = normalityTest(values);
        blocks.push(this.formatNormalityBlock(`${this.varName} [${group}]`, values.length, normality, alpha));
      }
    } else if (current.values) {
      const normality = normalityTest(current.values);
      blocks.push(this.formatNormalityBlock(this.varName, current.values.length, normality, alpha));
    }
    const text = blocks.join('\n\n');
    if (append) {
      this.appendOutput(text, focus);
      return;
    }
    this.setOutput(text, focus);
  }

  private runCapability(append = false, focus = true): void {
    const current = this.currentData();
    if (current.error) {
      if (!append) {
        this.showWarning(current.error);
      }
      return;
    }
    let lsl: number | null;
    let usl: number | null;
    let target: number | null;
    try {
      lsl = parseOptionalFloat(this.lslText);
      usl = parseOptionalFloat(this.uslText);
      target = parseOptionalFloat(this.targetText);
    } catch (error) {
      if (!append) {
        this.showError(this.errorToMessage(error));
      }
      return;
    }
    const blocks: string[] = [];
    if (current.grouped) {
      for (const [group, values] of Object.entries(current.grouped)) {
        const cap = capability(values, lsl, usl);
        blocks.push(this.formatCapabilityBlock(`${this.varName} [${group}]`, cap, target));
      }
    } else if (current.values) {
      const cap = capability(current.values, lsl, usl);
      blocks.push(this.formatCapabilityBlock(this.varName, cap, target));
    }
    const text = blocks.join('\n\n');
    if (append) {
      this.appendOutput(text, focus);
      return;
    }
    this.setOutput(text, focus);
  }

  private formatDescriptiveBlock(varName: string, stats: DescriptiveStats): string {
    return [
      '=== Estadistica descriptiva ===',
      `Variable: ${varName}`,
      `N: ${stats.n}`,
      `Media: ${formatFloat(stats.mean)}`,
      `Varianza: ${formatFloat(stats.variance)}`,
      `Desv. estandar: ${formatFloat(stats.std)}`,
      `Moda: ${typeof stats.mode === 'number' ? formatFloat(stats.mode) : stats.mode}`,
      `Minimo: ${formatFloat(stats.min)}`,
      `Q1: ${formatFloat(stats.q1)}`,
      `Mediana: ${formatFloat(stats.median)}`,
      `Q3: ${formatFloat(stats.q3)}`,
      `Maximo: ${formatFloat(stats.max)}`,
      `Rango: ${formatFloat(stats.range)}`,
      `IQR: ${formatFloat(stats.iqr)}`,
      `P10: ${formatFloat(stats.p10)}`,
      `P90: ${formatFloat(stats.p90)}`,
      `P95: ${formatFloat(stats.p95)}`,
      `Skewness: ${formatFloat(stats.skew)}`,
      `Kurtosis: ${formatFloat(stats.kurt)}`
    ].join('\n');
  }

  private formatNormalityBlock(
    varName: string,
    n: number,
    normality: ReturnType<typeof normalityTest>,
    alpha: number
  ): string {
    const conclusion = normality.pValue == null
      ? 'No concluyente'
      : (normality.pValue >= alpha ? 'No se rechaza normalidad' : 'Se rechaza normalidad');
    return [
      '=== Prueba de normalidad ===',
      `Variable: ${varName}`,
      `Prueba: ${normality.testName}`,
      `N: ${n}`,
      `Estadistico: ${formatFloat(normality.statistic)}`,
      `p-value: ${formatFloat(normality.pValue)}`,
      `Conclusion (alpha=${alpha}): ${conclusion}`,
      `Nota: ${normality.note}`
    ].join('\n');
  }

  private formatCapabilityBlock(varName: string, cap: CapabilityResult, target: number | null): string {
    if (!cap.cp && !cap.cpu && !cap.cpl && !cap.cpk && !cap.warning) {
      return `=== Capacidad de proceso ===\nVariable: ${varName}\nNo se pudo calcular capacidad (N insuficiente).`;
    }
    if (cap.warning) {
      return `=== Capacidad de proceso ===\nVariable: ${varName}\nAdvertencia: ${cap.warning}`;
    }
    const lines = [
      '=== Capacidad de proceso ===',
      `Variable: ${varName}`,
      `Media: ${formatFloat(cap.mean)}`,
      `Sigma: ${formatFloat(cap.sigma)}`,
      `Cp: ${formatFloat(cap.cp)}`,
      `Cpl: ${formatFloat(cap.cpl)}`,
      `Cpu: ${formatFloat(cap.cpu)}`,
      `Cpk: ${formatFloat(cap.cpk)}`,
      `Pp: ${formatFloat(cap.pp)}`,
      `Ppk: ${formatFloat(cap.ppk)}`
    ];
    if (target != null && cap.mean != null) {
      lines.push(`Desviacion al target: ${formatFloat(cap.mean - target)}`);
    }
    return lines.join('\n');
  }

  private currentData(): { values: number[] | null; grouped: Record<string, number[]> | null; error: string | null } {
    if (!this.varName || !this.columnNames.includes(this.varName)) {
      return { values: null, grouped: null, error: 'Selecciona una variable valida.' };
    }
    if (this.groupMode === 'Superpuesto' && this.groupBy !== '(Ninguno)') {
      const grouped = this.groupedNumeric(this.varName, this.groupBy);
      if (Object.keys(grouped).length === 0) {
        return { values: null, grouped: null, error: 'No hay datos numericos validos para analisis agrupado.' };
      }
      return { values: null, grouped, error: null };
    }
    const values = this.numericColumn(this.varName);
    if (values.length === 0) {
      return { values: null, grouped: null, error: `No hay datos numericos validos en ${this.varName}.` };
    }
    return { values, grouped: null, error: null };
  }

  private histParams(): {
    bins: number | 'auto';
    classMethod: ClassMethod;
    lsl: number | null;
    usl: number | null;
    target: number | null;
  } {
    let bins: number | 'auto' = 'auto';
    if (this.binsMode === 'manual') {
      const raw = this.binsManualText.trim();
      if (!/^\d+$/.test(raw) || Number(raw) <= 0) {
        throw new Error('Bins manual debe ser un entero positivo.');
      }
      bins = Number(raw);
    }
    return {
      bins,
      classMethod: this.classMethod,
      lsl: parseOptionalFloat(this.lslText),
      usl: parseOptionalFloat(this.uslText),
      target: parseOptionalFloat(this.targetText)
    };
  }

  private queueDraw(): void {
    requestAnimationFrame(() => this.drawHistogram());
  }

  private drawHistogram(): void {
    const canvas = this.histCanvas?.nativeElement;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(760, Math.floor(rect.width || 980));
    const height = Math.max(420, Math.floor(rect.height || 520));
    const ratio = Math.max(1, window.devicePixelRatio || 1);

    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (!this.histogramModel) {
      this.drawHistogramPlaceholder(ctx, width, height);
      return;
    }

    this.drawHistogramModel(ctx, width, height, this.histogramModel);
  }

  private drawHistogramPlaceholder(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = '#f8fbff';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#d7e5f7';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
    ctx.fillStyle = '#4a6488';
    ctx.font = '600 16px Sora, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Genera un histograma para visualizar resultados.', width / 2, height / 2);
  }

  private drawHistogramModel(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    model: HistogramModel
  ): void {
    if (model.allValues.length === 0) {
      this.drawHistogramPlaceholder(ctx, width, height);
      return;
    }
    const edges = this.computeBinEdges(model.allValues, model.bins, model.discrete, model.classMethod);
    if (edges.length < 2) {
      this.drawHistogramPlaceholder(ctx, width, height);
      return;
    }

    const left = 64;
    const right = 24;
    const top = 34;
    const bottom = 64;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const xMin = edges[0];
    const xMax = edges[edges.length - 1];
    const integerXAxis = this.shouldUseIntegerXAxis(model.allValues);

    const histograms = model.datasets.map((dataset) => ({
      ...dataset,
      ...this.histogramHeights(dataset.values, edges, model.scale)
    }));

    let yMax = histograms.reduce((acc, hist) => Math.max(acc, ...hist.heights), 0);
    const binWidth = this.meanBinWidth(edges);
    const fitLine = model.showFit ? this.normalCurve(model.allValues, xMin, xMax, model.scale, binWidth) : null;
    if (fitLine && fitLine.y.length > 0) {
      yMax = Math.max(yMax, ...fitLine.y);
    }
    const kdeLine = model.showKde ? this.kdeCurve(model.allValues, xMin, xMax, model.scale, binWidth) : null;
    if (kdeLine && kdeLine.y.length > 0) {
      yMax = Math.max(yMax, ...kdeLine.y);
    }
    yMax = yMax > 0 ? yMax * 1.1 : 1;

    const toX = (value: number): number => left + ((value - xMin) / (xMax - xMin || 1)) * plotWidth;
    const toY = (value: number): number => top + plotHeight - (value / yMax) * plotHeight;

    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#f8fbff');
    bgGradient.addColorStop(1, '#eef5ff');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(left, top, plotWidth, plotHeight);

    ctx.strokeStyle = '#d8e5f6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i += 1) {
      const y = top + (plotHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(left + plotWidth, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#9fb6d3';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(left, top + plotHeight);
    ctx.lineTo(left + plotWidth, top + plotHeight);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, top + plotHeight);
    ctx.stroke();

    const hasGroups = histograms.length > 1;
    for (const histogram of histograms) {
      const alpha = hasGroups ? 0.48 : 0.85;
      ctx.fillStyle = this.hexToRgba(histogram.color, alpha);
      for (let index = 0; index < histogram.heights.length; index += 1) {
        const x0 = toX(edges[index]);
        const x1 = toX(edges[index + 1]);
        const barWidth = Math.max(1, x1 - x0 - 1);
        const y = toY(histogram.heights[index]);
        ctx.fillRect(x0 + 0.5, y, barWidth, top + plotHeight - y);
      }
    }

    if (fitLine) {
      this.drawLine(ctx, fitLine.x, fitLine.y, toX, toY, '#f97316', 2.2);
    }
    if (kdeLine) {
      this.drawLine(ctx, kdeLine.x, kdeLine.y, toX, toY, '#0f766e', 2.2);
    }

    if (model.showLimits) {
      this.drawVerticalLimit(ctx, model.lsl, toX, top, plotHeight, '#dc2626');
      this.drawVerticalLimit(ctx, model.usl, toX, top, plotHeight, '#dc2626');
      this.drawVerticalLimit(ctx, model.target, toX, top, plotHeight, '#16a34a');
    }

    ctx.fillStyle = '#163258';
    ctx.font = '700 18px Sora, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Histograma', width / 2, 22);

    ctx.fillStyle = '#23456f';
    ctx.font = '600 12px Sora, sans-serif';
    ctx.fillText(model.variableLabel, left + plotWidth / 2, height - 22);

    ctx.save();
    ctx.translate(18, top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(this.scaleLabel(model.scale), 0, 0);
    ctx.restore();

    ctx.fillStyle = '#31567f';
    ctx.font = '500 11px Sora, sans-serif';
    for (let i = 0; i <= 5; i += 1) {
      const tickValue = yMax * (1 - i / 5);
      const y = top + (plotHeight / 5) * i;
      ctx.textAlign = 'right';
      ctx.fillText(formatFloat(tickValue, 4), left - 8, y + 4);
    }

    for (let i = 0; i <= 5; i += 1) {
      const xValue = xMin + ((xMax - xMin) * i) / 5;
      const x = left + (plotWidth * i) / 5;
      ctx.textAlign = 'center';
      ctx.fillText(this.formatAxisTick(xValue, integerXAxis), x, top + plotHeight + 18);
    }

    this.drawLegend(ctx, model, left + 12, top + 12);
    if (model.showStats && model.stats) {
      this.drawStatsCard(ctx, model.stats, width - 192, top + 12);
    }
  }

  private drawLegend(ctx: CanvasRenderingContext2D, model: HistogramModel, startX: number, startY: number): void {
    const items: { label: string; color: string }[] = [];
    for (const dataset of model.datasets) {
      if (dataset.label) {
        items.push({ label: dataset.label, color: dataset.color });
      }
    }
    if (model.showFit) {
      items.push({ label: 'Ajuste normal', color: '#f97316' });
    }
    if (model.showKde) {
      items.push({ label: 'KDE', color: '#0f766e' });
    }
    if (model.showLimits && model.lsl != null) {
      items.push({ label: 'LSL', color: '#dc2626' });
    }
    if (model.showLimits && model.usl != null) {
      items.push({ label: 'USL', color: '#dc2626' });
    }
    if (model.showLimits && model.target != null) {
      items.push({ label: 'Target', color: '#16a34a' });
    }
    if (items.length === 0) {
      return;
    }

    let y = startY;
    for (const item of items) {
      ctx.fillStyle = item.color;
      ctx.fillRect(startX, y, 10, 10);
      ctx.fillStyle = '#294d75';
      ctx.font = '500 11px Sora, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, startX + 15, y + 9);
      y += 15;
    }
  }

  private drawStatsCard(ctx: CanvasRenderingContext2D, stats: DescriptiveStats, x: number, y: number): void {
    const width = 176;
    const height = 96;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.strokeStyle = '#c3d6ee';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#17375f';
    ctx.font = '600 11px Sora, sans-serif';
    const lines = [
      `N: ${stats.n}`,
      `Media: ${formatFloat(stats.mean)}`,
      `Desv: ${formatFloat(stats.std)}`,
      `Min: ${formatFloat(stats.min)}`,
      `Max: ${formatFloat(stats.max)}`
    ];
    lines.forEach((line, index) => {
      ctx.fillText(line, x + 10, y + 18 + index * 16);
    });
  }

  private drawVerticalLimit(
    ctx: CanvasRenderingContext2D,
    value: number | null,
    toX: (value: number) => number,
    top: number,
    plotHeight: number,
    color: string
  ): void {
    if (value == null) {
      return;
    }
    const x = toX(value);
    ctx.save();
    ctx.setLineDash([7, 5]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + plotHeight);
    ctx.stroke();
    ctx.restore();
  }

  private drawLine(
    ctx: CanvasRenderingContext2D,
    x: number[],
    y: number[],
    toX: (value: number) => number,
    toY: (value: number) => number,
    color: string,
    width: number
  ): void {
    if (x.length === 0 || y.length === 0 || x.length !== y.length) {
      return;
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(toX(x[0]), toY(y[0]));
    for (let index = 1; index < x.length; index += 1) {
      ctx.lineTo(toX(x[index]), toY(y[index]));
    }
    ctx.stroke();
  }

  private histogramHeights(values: number[], edges: number[], scale: HistScale): { heights: number[]; counts: number[] } {
    const bins = edges.length - 1;
    const counts = Array.from({ length: bins }, () => 0);
    if (values.length === 0) {
      return { heights: counts, counts };
    }

    for (const value of values) {
      if (value < edges[0] || value > edges[edges.length - 1]) {
        continue;
      }
      let binIndex = bins - 1;
      for (let index = 0; index < bins; index += 1) {
        const lower = edges[index];
        const upper = edges[index + 1];
        const isLast = index === bins - 1;
        if ((value >= lower && value < upper) || (isLast && value === upper)) {
          binIndex = index;
          break;
        }
      }
      counts[binIndex] += 1;
    }

    const heights = counts.map((count, index) => {
      const binWidth = Math.max(edges[index + 1] - edges[index], 1e-9);
      if (scale === 'Porcentaje') {
        return (count * 100) / values.length;
      }
      if (scale === 'Probabilidad') {
        return count / values.length;
      }
      return count / (values.length * binWidth);
    });
    return { heights, counts };
  }

  private normalCurve(
    values: number[],
    min: number,
    max: number,
    scale: HistScale,
    binWidth: number
  ): { x: number[]; y: number[] } | null {
    if (values.length < 2) {
      return null;
    }
    const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
    const variance = values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / (values.length - 1);
    const sigma = Math.sqrt(variance);
    if (sigma <= 0) {
      return null;
    }
    const points = 260;
    const x: number[] = [];
    const y: number[] = [];
    for (let index = 0; index < points; index += 1) {
      const currentX = min + ((max - min) * index) / (points - 1);
      const z = (currentX - mean) / sigma;
      let currentY = Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
      if (scale === 'Porcentaje') {
        currentY *= 100;
      } else if (scale === 'Probabilidad') {
        currentY *= binWidth;
      }
      x.push(currentX);
      y.push(currentY);
    }
    return { x, y };
  }

  private kdeCurve(
    values: number[],
    min: number,
    max: number,
    scale: HistScale,
    binWidth: number
  ): { x: number[]; y: number[] } | null {
    if (values.length < 2) {
      return null;
    }
    const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
    const variance = values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / (values.length - 1);
    const sigma = Math.sqrt(Math.max(variance, 1e-9));
    const range = Math.max(max - min, 1e-9);
    const bandwidth = Math.max(1.06 * sigma * (values.length ** (-1 / 5)), range / 200);
    const points = 260;
    const x: number[] = [];
    const y: number[] = [];
    for (let index = 0; index < points; index += 1) {
      const currentX = min + ((max - min) * index) / (points - 1);
      let kernelSum = 0;
      for (const value of values) {
        const u = (currentX - value) / bandwidth;
        kernelSum += Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
      }
      let currentY = kernelSum / (values.length * bandwidth);
      if (scale === 'Porcentaje') {
        currentY *= 100;
      } else if (scale === 'Probabilidad') {
        currentY *= binWidth;
      }
      x.push(currentX);
      y.push(currentY);
    }
    return { x, y };
  }

  private computeBinEdges(
    values: number[],
    bins: number | 'auto',
    discrete: boolean,
    classMethod: ClassMethod
  ): number[] {
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);

    if (rawMin === rawMax) {
      const span = discrete ? 1 : Math.max(Math.abs(rawMin) * 0.2, 1);
      return [rawMin - (span / 2), rawMax + (span / 2)];
    }

    const min = discrete ? Math.floor(rawMin) : rawMin;
    const max = discrete ? Math.ceil(rawMax) : rawMax;

    const requestedBins = bins === 'auto' ? this.recommendedBinCount(values.length) : bins;
    const binCount = Math.max(1, Math.min(120, Math.floor(requestedBins)));
    const span = max - min;

    let width = Math.max(span / binCount, 1e-9);
    let start = min;
    if (classMethod === 'midpoint' && binCount > 1) {
      width = Math.max(span / (binCount - 1), 1e-9);
      start = min - (width / 2);
    }

    const edges: number[] = [];
    for (let index = 0; index <= binCount; index += 1) {
      edges.push(start + (index * width));
    }
    return edges;
  }

  private recommendedBinCount(sampleSize: number): number {
    if (sampleSize <= 1) {
      return 1;
    }
    const raw = sampleSize > 200
      ? 1 + (3.222 * Math.log10(sampleSize))
      : Math.sqrt(sampleSize);
    return Math.max(1, Math.ceil(raw));
  }

  private meanBinWidth(edges: number[]): number {
    if (edges.length < 2) {
      return 1;
    }
    let total = 0;
    for (let index = 0; index < edges.length - 1; index += 1) {
      total += Math.max(edges[index + 1] - edges[index], 1e-9);
    }
    return total / (edges.length - 1);
  }

  private shouldUseIntegerXAxis(values: number[]): boolean {
    return values.length > 0 && values.every((value) => Number.isInteger(value));
  }

  private formatAxisTick(value: number, useInteger: boolean): string {
    if (useInteger) {
      return String(Math.round(value));
    }
    return formatFloat(value, 4);
  }

  private scaleLabel(scale: HistScale): string {
    if (scale === 'Porcentaje') {
      return 'Porcentaje';
    }
    if (scale === 'Probabilidad') {
      return 'Probabilidad';
    }
    return 'Densidad';
  }

  private hexToRgba(hex: string, alpha: number): string {
    const normalized = hex.replace('#', '');
    const base = normalized.length === 3
      ? normalized.split('').map((char) => `${char}${char}`).join('')
      : normalized;
    const value = Number.parseInt(base, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private refreshColumnControls(): void {
    if (!this.columnNames.includes(this.varName)) {
      this.varName = this.columnNames[0] ?? '';
    }
    if (this.groupBy !== '(Ninguno)' && !this.columnNames.includes(this.groupBy)) {
      this.groupBy = '(Ninguno)';
    }
    this.refreshViews();
  }

  private refreshViews(): void {
    this.refreshPreview();
    this.refreshSummary();
  }

  private refreshPreview(): void {
    this.previewRows = this.rows.slice(0, 200).map((row) => this.normalizeRow(row, this.columnNames.length));
  }

  private refreshSummary(): void {
    this.summaryRows = this.columnNames.map((column) => {
      const values = this.numericColumn(column);
      const stats = descriptiveStats(values);
      if (!stats) {
        return {
          variable: column,
          n: '0',
          mean: '-',
          variance: '-',
          std: '-',
          mode: '-',
          min: '-',
          q1: '-',
          median: '-',
          q3: '-',
          iqr: '-',
          max: '-'
        };
      }
      return {
        variable: column,
        n: String(stats.n),
        mean: formatFloat(stats.mean),
        variance: formatFloat(stats.variance),
        std: formatFloat(stats.std),
        mode: typeof stats.mode === 'number' ? formatFloat(stats.mode) : stats.mode,
        min: formatFloat(stats.min),
        q1: formatFloat(stats.q1),
        median: formatFloat(stats.median),
        q3: formatFloat(stats.q3),
        iqr: formatFloat(stats.iqr),
        max: formatFloat(stats.max)
      };
    });
  }

  private setOutput(text: string, focus = true): void {
    this.outputText = text;
    if (focus) {
      this.activeTab = 'output';
    }
  }

  private appendOutput(text: string, focus = false): void {
    if (!text.trim()) {
      return;
    }
    this.outputText = this.outputText.trim()
      ? `${this.outputText.trim()}\n\n${text}`
      : text;
    if (focus) {
      this.activeTab = 'output';
    }
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.statusMessage = 'Error';
  }

  private showWarning(message: string): void {
    this.errorMessage = message;
    this.statusMessage = 'Datos incompletos';
  }

  private updateCell(rowIndex: number, colIndex: number, value: string): void {
    if (!this.rows[rowIndex] || colIndex < 0 || colIndex >= this.columnNames.length) {
      return;
    }
    this.rows[rowIndex][colIndex] = value;
    this.refreshViews();
  }

  private numericColumn(columnName: string): number[] {
    const index = this.columnNames.indexOf(columnName);
    if (index < 0) {
      return [];
    }
    const values: number[] = [];
    for (const row of this.rows) {
      const raw = (row[index] ?? '').trim();
      if (raw && isNumberText(raw)) {
        values.push(Number(raw));
      }
    }
    return values;
  }

  private groupedNumeric(valueCol: string, groupCol: string): Record<string, number[]> {
    const valueIndex = this.columnNames.indexOf(valueCol);
    const groupIndex = this.columnNames.indexOf(groupCol);
    if (valueIndex < 0 || groupIndex < 0) {
      return {};
    }
    const grouped: Record<string, number[]> = {};
    for (const row of this.rows) {
      const valueText = (row[valueIndex] ?? '').trim();
      const groupText = (row[groupIndex] ?? '').trim() || '(vacio)';
      if (!valueText || !isNumberText(valueText)) {
        continue;
      }
      const numericValue = Number(valueText);
      if (!grouped[groupText]) {
        grouped[groupText] = [];
      }
      grouped[groupText].push(numericValue);
    }
    return grouped;
  }

  private createEmptyRows(rows: number, cols: number): string[][] {
    return Array.from({ length: rows }, () => this.createEmptyRow(cols));
  }

  private createEmptyRow(cols: number): string[] {
    return Array.from({ length: cols }, () => '');
  }

  private normalizeRow(row: string[], cols: number): string[] {
    const normalized = Array.from({ length: cols }, (_, index) => row[index] ?? '');
    return normalized;
  }

  private parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      const next = text[index + 1];

      if (insideQuotes) {
        if (char === '"' && next === '"') {
          currentCell += '"';
          index += 1;
          continue;
        }
        if (char === '"') {
          insideQuotes = false;
          continue;
        }
        currentCell += char;
        continue;
      }

      if (char === '"') {
        insideQuotes = true;
        continue;
      }
      if (char === ',') {
        currentRow.push(currentCell);
        currentCell = '';
        continue;
      }
      if (char === '\n') {
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        continue;
      }
      if (char === '\r') {
        continue;
      }
      currentCell += char;
    }

    currentRow.push(currentCell);
    if (currentRow.length > 1 || currentRow[0]?.trim() || rows.length === 0) {
      rows.push(currentRow);
    }

    return rows.filter((row) => row.some((cell) => cell.length > 0));
  }

  private csvEscape(value: string): string {
    const escaped = value.replaceAll('"', '""');
    if (/[",\n\r]/.test(value)) {
      return `"${escaped}"`;
    }
    return escaped;
  }

  private errorToMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
