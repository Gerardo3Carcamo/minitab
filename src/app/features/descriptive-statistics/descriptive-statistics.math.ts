export interface ModeValue {
  value: number;
  count: number;
}

export interface ParseDataResult {
  values: number[];
  invalidTokens: string[];
}

export interface DescriptiveStatisticsResult {
  n: number;
  mean: number;
  median: number;
  q1: number;
  q2: number;
  q3: number;
  modes: ModeValue[];
  modeCount: number | null;
  variance: number;
  stdDev: number;
  min: number;
  max: number;
  range: number;
  classCountRaw: number;
  classCount: number;
  classCountMethod: 'log' | 'sqrt';
  amplitude: number;
}

export function parseDataInput(text: string): ParseDataResult {
  const tokens = text
    .split(/[\s,;]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  const values: number[] = [];
  const invalidTokens: string[] = [];

  for (const token of tokens) {
    const value = Number(token);
    if (Number.isFinite(value)) {
      values.push(value);
      continue;
    }
    invalidTokens.push(token);
  }

  return { values, invalidTokens };
}

export function calculateDescriptiveStatistics(values: number[]): DescriptiveStatisticsResult | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((acc, current) => acc + current, 0) / n;
  const variance = n > 1 ? sampleVariance(sorted, mean) : 0;
  const stdDev = Math.sqrt(variance);
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;
  const median = calculateMedian(sorted);
  const q1 = minitabQuartile(sorted, 1);
  const q3 = minitabQuartile(sorted, 3);
  const { modes, modeCount } = calculateModes(sorted);
  const classCountData = calculateClassCount(n);
  const amplitude = range / classCountData.k;

  return {
    n,
    mean,
    median,
    q1,
    q2: median,
    q3,
    modes,
    modeCount,
    variance,
    stdDev,
    min,
    max,
    range,
    classCountRaw: classCountData.raw,
    classCount: classCountData.k,
    classCountMethod: classCountData.method,
    amplitude
  };
}

function calculateClassCount(n: number): { raw: number; k: number; method: 'log' | 'sqrt' } {
  if (n > 200) {
    const raw = 1 + (3.222 * Math.log10(n));
    return {
      raw,
      k: Math.max(1, Math.ceil(raw)),
      method: 'log'
    };
  }

  const raw = Math.sqrt(n);
  return {
    raw,
    k: Math.max(1, Math.ceil(raw)),
    method: 'sqrt'
  };
}

function sampleVariance(values: number[], mean: number): number {
  const n = values.length;
  if (n < 2) {
    return 0;
  }
  const sumSquares = values.reduce((acc, current) => {
    const delta = current - mean;
    return acc + delta * delta;
  }, 0);
  return sumSquares / (n - 1);
}

function calculateMedian(sortedValues: number[]): number {
  const n = sortedValues.length;
  const mid = Math.floor(n / 2);
  if (n % 2 === 0) {
    return (sortedValues[mid - 1] + sortedValues[mid]) / 2;
  }
  return sortedValues[mid];
}

function minitabQuartile(sortedValues: number[], quartile: 1 | 3): number {
  const n = sortedValues.length;
  if (n === 0) {
    return Number.NaN;
  }
  if (n === 1) {
    return sortedValues[0];
  }

  const w = quartile === 1 ? (n + 1) / 4 : (3 * (n + 1)) / 4;

  if (w <= 1) {
    return sortedValues[0];
  }
  if (w >= n) {
    return sortedValues[n - 1];
  }

  const y = Math.floor(w);
  const z = w - y;

  if (z === 0) {
    return sortedValues[y - 1];
  }

  const lower = sortedValues[y - 1];
  const upper = sortedValues[y];
  return lower + (z * (upper - lower));
}

function calculateModes(values: number[]): { modes: ModeValue[]; modeCount: number | null } {
  const frequency = new Map<string, ModeValue>();
  for (const value of values) {
    const key = Number(value.toPrecision(12)).toString();
    const current = frequency.get(key);
    if (current) {
      current.count += 1;
      continue;
    }
    frequency.set(key, { value, count: 1 });
  }

  let maxCount = 0;
  for (const current of frequency.values()) {
    if (current.count > maxCount) {
      maxCount = current.count;
    }
  }

  if (maxCount <= 1) {
    return { modes: [], modeCount: null };
  }

  const modes = [...frequency.values()]
    .filter((current) => current.count === maxCount)
    .sort((a, b) => a.value - b.value);

  return { modes, modeCount: maxCount };
}

export function formatStat(value: number, digits = 8): string {
  if (!Number.isFinite(value)) {
    return 'N/A';
  }
  const rounded = Number.parseFloat(value.toPrecision(digits));
  return rounded.toString();
}
