import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  calculateDescriptiveStatistics,
  formatStat,
  parseDataInput,
  type DescriptiveStatisticsResult
} from './descriptive-statistics.math';

interface VisualizationOptions {
  n: boolean;
  mean: boolean;
  median: boolean;
  mode: boolean;
  modeCount: boolean;
  variance: boolean;
  stdDev: boolean;
  min: boolean;
  max: boolean;
  quartiles: boolean;
}

@Component({
  selector: 'app-descriptive-statistics-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './descriptive-statistics.page.html',
  styleUrl: './descriptive-statistics.page.scss'
})
export class DescriptiveStatisticsPageComponent {
  readonly exampleData = [
    '12.4',
    '11.8',
    '13.1',
    '12.6',
    '12.4',
    '12.9',
    '13.4',
    '12.4',
    '13.0',
    '12.2',
    '12.7',
    '12.4'
  ].join('\n');

  dataText = this.exampleData;
  errorMessage: string | null = null;
  warningMessage: string | null = null;
  fileInfoMessage: string | null = null;
  isLoadingFile = false;
  invalidTokens: string[] = [];
  parsedValues: number[] = [];
  summary: DescriptiveStatisticsResult | null = null;
  viewOptions: VisualizationOptions = {
    n: true,
    mean: true,
    median: true,
    mode: true,
    modeCount: true,
    variance: true,
    stdDev: true,
    min: true,
    max: true,
    quartiles: false
  };

  constructor() {
    this.calculate();
  }

  calculate(): void {
    const parsed = parseDataInput(this.dataText);
    this.invalidTokens = parsed.invalidTokens;
    this.fileInfoMessage = null;

    if (this.invalidTokens.length > 0) {
      this.errorMessage = `Hay valores no numericos: ${this.invalidTokensPreview}.`;
      this.parsedValues = [];
      this.summary = null;
      return;
    }

    const result = calculateDescriptiveStatistics(parsed.values);
    if (!result) {
      this.errorMessage = 'Ingresa al menos un valor numerico para calcular.';
      this.parsedValues = [];
      this.summary = null;
      return;
    }

    this.errorMessage = null;
    this.parsedValues = parsed.values;
    this.summary = result;
  }

  loadExample(): void {
    this.dataText = this.exampleData;
    this.calculate();
  }

  clearData(): void {
    this.dataText = '';
    this.errorMessage = null;
    this.warningMessage = null;
    this.fileInfoMessage = null;
    this.invalidTokens = [];
    this.parsedValues = [];
    this.summary = null;
  }

  async onFileSelected(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0];
    if (!file) {
      return;
    }

    this.isLoadingFile = true;
    this.errorMessage = null;
    this.warningMessage = null;
    this.fileInfoMessage = null;

    try {
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.csv') || lowerName.endsWith('.txt')) {
        await this.loadCsvOrText(file);
      } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        await this.loadExcel(file);
      } else {
        throw new Error('Formato no soportado. Usa CSV, XLSX o XLS.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cargar el archivo.';
      this.errorMessage = message;
    } finally {
      this.isLoadingFile = false;
      if (target) {
        target.value = '';
      }
    }
  }

  formatNumber(value: number): string {
    return formatStat(value);
  }

  setAllVisualizationOptions(value: boolean): void {
    this.viewOptions = {
      n: value,
      mean: value,
      median: value,
      mode: value,
      modeCount: value,
      variance: value,
      stdDev: value,
      min: value,
      max: value,
      quartiles: value
    };
  }

  get hasAnyMetricSelected(): boolean {
    return Object.values(this.viewOptions).some(Boolean);
  }

  get modeDisplay(): string {
    if (!this.summary || this.summary.modes.length === 0) {
      return 'Sin moda';
    }
    return this.summary.modes.map((mode) => formatStat(mode.value)).join(', ');
  }

  get modeCountDisplay(): string {
    if (!this.summary || this.summary.modeCount == null) {
      return '-';
    }
    return this.summary.modeCount.toString();
  }

  get invalidTokensPreview(): string {
    if (this.invalidTokens.length === 0) {
      return '';
    }
    const preview = this.invalidTokens.slice(0, 6);
    const hasMore = this.invalidTokens.length > preview.length;
    return preview.join(', ') + (hasMore ? ', ...' : '');
  }

  get valuesPreview(): string {
    if (this.parsedValues.length === 0) {
      return '';
    }
    const preview = this.parsedValues.slice(0, 20).map((value) => formatStat(value)).join(', ');
    const hasMore = this.parsedValues.length > 20;
    return preview + (hasMore ? ', ...' : '');
  }

  private async loadCsvOrText(file: File): Promise<void> {
    const content = await file.text();
    const tokens = content
      .split(/[\s,;]+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0);

    const numericValues: number[] = [];
    let skipped = 0;
    for (const token of tokens) {
      const parsed = this.parseCellValue(token);
      if (parsed == null) {
        skipped += 1;
      } else {
        numericValues.push(parsed);
      }
    }

    this.applyImportedValues(file.name, numericValues, skipped);
  }

  private async loadExcel(file: File): Promise<void> {
    const xlsx = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'array', raw: true });
    if (workbook.SheetNames.length === 0) {
      throw new Error('El Excel no contiene hojas.');
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: true,
      blankrows: false
    });

    const numericValues: number[] = [];
    let skipped = 0;
    for (const row of rows) {
      for (const cell of row) {
        if (cell == null || cell === '') {
          continue;
        }
        const parsed = this.parseCellValue(cell);
        if (parsed == null) {
          skipped += 1;
        } else {
          numericValues.push(parsed);
        }
      }
    }

    this.applyImportedValues(file.name, numericValues, skipped);
  }

  private applyImportedValues(fileName: string, numericValues: number[], skipped: number): void {
    if (numericValues.length === 0) {
      throw new Error('No se encontraron valores numericos en el archivo.');
    }

    this.dataText = numericValues.map((value) => formatStat(value)).join('\n');
    this.warningMessage = skipped > 0 ? `Se omitieron ${skipped} celdas no numericas.` : null;
    this.fileInfoMessage = `Archivo cargado: ${fileName}. Valores numericos detectados: ${numericValues.length}.`;
    this.calculate();
    this.fileInfoMessage = `Archivo cargado: ${fileName}. Valores numericos detectados: ${numericValues.length}.`;
  }

  private parseCellValue(raw: unknown): number | null {
    if (typeof raw === 'number') {
      return Number.isFinite(raw) ? raw : null;
    }

    if (typeof raw !== 'string') {
      return null;
    }

    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }

    const parsedDirect = Number(trimmed);
    if (Number.isFinite(parsedDirect)) {
      return parsedDirect;
    }

    const normalized = this.normalizeNumericString(trimmed);
    if (!normalized) {
      return null;
    }
    const parsedNormalized = Number(normalized);
    return Number.isFinite(parsedNormalized) ? parsedNormalized : null;
  }

  private normalizeNumericString(value: string): string | null {
    const compact = value.replace(/\s+/g, '');

    if (!compact.includes(',') && !compact.includes('.')) {
      return compact;
    }

    if (compact.includes(',') && compact.includes('.')) {
      const lastComma = compact.lastIndexOf(',');
      const lastDot = compact.lastIndexOf('.');
      if (lastComma > lastDot) {
        return compact.replace(/\./g, '').replace(',', '.');
      }
      return compact.replace(/,/g, '');
    }

    if (compact.includes(',') && !compact.includes('.')) {
      return compact.replace(',', '.');
    }

    return compact;
  }
}
