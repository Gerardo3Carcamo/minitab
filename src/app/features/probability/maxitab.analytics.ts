export interface DescriptiveStats {
  n: number;
  mean: number;
  variance: number;
  std: number;
  mode: number | string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  range: number;
  iqr: number;
  p10: number;
  p90: number;
  p95: number;
  skew: number;
  kurt: number;
}

export interface NormalityResult {
  testName: string;
  statistic: number | null;
  pValue: number | null;
  note: string;
}

export interface CapabilityResult {
  mean?: number;
  sigma?: number;
  cp?: number;
  cpu?: number;
  cpl?: number;
  cpk?: number;
  pp?: number;
  ppk?: number;
  warning?: string;
}

export function isNumberText(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  return Number.isFinite(Number(trimmed));
}

export function formatFloat(value: number | null | undefined, digits = 6): string {
  if (value == null || !Number.isFinite(value)) {
    return 'N/A';
  }
  const rounded = Number.parseFloat(value.toPrecision(digits));
  if (!Number.isFinite(rounded)) {
    return 'N/A';
  }
  return rounded.toString();
}

export function parseOptionalFloat(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  if (!isNumberText(trimmed)) {
    throw new Error(`Valor invalido: ${trimmed}`);
  }
  return Number(trimmed);
}

export function descriptiveStats(values: number[]): DescriptiveStats | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((acc, value) => acc + value, 0) / n;
  const variance = n > 1 ? sampleVariance(sorted, mean) : 0;
  const sd = n > 1 ? sampleStd(sorted, mean) : 0;
  const mode = sampleMode(sorted);
  const q1 = percentile(sorted, 0.25);
  const median = percentile(sorted, 0.5);
  const q3 = percentile(sorted, 0.75);
  const p10 = percentile(sorted, 0.1);
  const p90 = percentile(sorted, 0.9);
  const p95 = percentile(sorted, 0.95);
  const skew = n > 2 ? sampleSkew(sorted, mean) : 0;
  const kurt = n > 3 ? sampleKurtosis(sorted, mean) : 0;

  const min = sorted[0];
  const max = sorted[n - 1];
  return {
    n,
    mean,
    variance,
    std: sd,
    mode,
    min,
    q1,
    median,
    q3,
    max,
    range: max - min,
    iqr: q3 - q1,
    p10,
    p90,
    p95,
    skew,
    kurt
  };
}

export function percentileValue(values: number[], percentileAsPercent: number): number | null {
  if (values.length === 0) {
    return null;
  }
  const p = percentileAsPercent / 100;
  if (!Number.isFinite(p) || p < 0 || p > 1) {
    throw new Error('Percentil invalido: usa un valor entre 0 y 100.');
  }
  const sorted = [...values].sort((a, b) => a - b);
  return percentile(sorted, p);
}

export function normalityTest(values: number[]): NormalityResult {
  const n = values.length;
  if (n < 3) {
    return {
      testName: 'Jarque-Bera (aprox.)',
      statistic: null,
      pValue: null,
      note: 'N insuficiente: se requieren al menos 3 datos.'
    };
  }
  const stats = descriptiveStats(values);
  if (!stats) {
    return {
      testName: 'Jarque-Bera (aprox.)',
      statistic: null,
      pValue: null,
      note: 'Sin datos para calcular.'
    };
  }
  const jb = (n / 6) * ((stats.skew ** 2) + 0.25 * (stats.kurt ** 2));
  const pValue = Math.exp(-jb / 2);
  const note = n > 5000
    ? 'n > 5000. Se uso aproximacion asintotica Jarque-Bera.'
    : 'Aproximacion frontend de normalidad (Jarque-Bera).';
  return {
    testName: 'Jarque-Bera (aprox.)',
    statistic: jb,
    pValue,
    note
  };
}

export function capability(values: number[], lsl: number | null, usl: number | null): CapabilityResult {
  if (values.length < 2) {
    return {};
  }
  const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
  const sigma = sampleStd(values, mean);
  if (sigma === 0) {
    return {
      warning: 'La desviacion estandar es 0; no se puede calcular capacidad.'
    };
  }
  const out: CapabilityResult = { mean, sigma };
  if (lsl != null && usl != null) {
    out.cp = (usl - lsl) / (6 * sigma);
    out.pp = (usl - lsl) / (6 * sigma);
  }
  if (usl != null) {
    out.cpu = (usl - mean) / (3 * sigma);
  }
  if (lsl != null) {
    out.cpl = (mean - lsl) / (3 * sigma);
  }
  if (out.cpu != null && out.cpl != null) {
    out.cpk = Math.min(out.cpu, out.cpl);
    out.ppk = out.cpk;
  }
  return out;
}

function percentile(sortedValues: number[], percentileValue: number): number {
  if (sortedValues.length === 0) {
    return Number.NaN;
  }
  if (sortedValues.length === 1) {
    return sortedValues[0];
  }
  const position = (sortedValues.length - 1) * percentileValue;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) {
    return sortedValues[lower];
  }
  const weight = position - lower;
  return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * weight;
}

function sampleStd(values: number[], mean: number): number {
  if (values.length < 2) {
    return 0;
  }
  return Math.sqrt(sampleVariance(values, mean));
}

function sampleVariance(values: number[], mean: number): number {
  if (values.length < 2) {
    return 0;
  }
  const sumSquares = values.reduce((acc, value) => {
    const delta = value - mean;
    return acc + delta * delta;
  }, 0);
  return sumSquares / (values.length - 1);
}

function sampleMode(values: number[]): number | string {
  const frequencies = new Map<string, { value: number; count: number }>();
  for (const value of values) {
    const key = Number(value.toPrecision(12)).toString();
    const current = frequencies.get(key);
    if (current) {
      current.count += 1;
    } else {
      frequencies.set(key, { value, count: 1 });
    }
  }
  let maxCount = 0;
  for (const entry of frequencies.values()) {
    if (entry.count > maxCount) {
      maxCount = entry.count;
    }
  }
  if (maxCount <= 1) {
    return 'Sin moda';
  }
  const modes = [...frequencies.values()]
    .filter((entry) => entry.count === maxCount)
    .map((entry) => entry.value)
    .sort((a, b) => a - b);
  if (modes.length === 1) {
    return modes[0];
  }
  return modes.map((value) => formatFloat(value)).join(', ');
}

function sampleSkew(values: number[], mean: number): number {
  const n = values.length;
  if (n < 3) {
    return 0;
  }
  const sd = sampleStd(values, mean);
  if (sd === 0) {
    return 0;
  }
  const sum = values.reduce((acc, value) => acc + ((value - mean) / sd) ** 3, 0);
  return (n / ((n - 1) * (n - 2))) * sum;
}

function sampleKurtosis(values: number[], mean: number): number {
  const n = values.length;
  if (n < 4) {
    return 0;
  }
  const sd = sampleStd(values, mean);
  if (sd === 0) {
    return 0;
  }
  const sum = values.reduce((acc, value) => acc + ((value - mean) / sd) ** 4, 0);
  return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum
    - (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
}
