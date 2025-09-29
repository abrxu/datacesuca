export const calculateMean = (data: number[]): number => {
  return data.reduce((a, b) => a + b, 0) / data.length;
};

export const calculateMedian = (data: number[]): number => {
  const sorted = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export const calculateMode = (data: number[]): number[] => {
    const freq: { [key: number]: number } = {};
    data.forEach(val => { freq[val] = (freq[val] || 0) + 1; });
    let modes: number[] = [];
    let maxFreq = 0;
    for (const key in freq) {
        const numKey = Number(key);
        if (freq[numKey] > maxFreq) {
            modes = [numKey];
            maxFreq = freq[numKey];
        } else if (freq[numKey] === maxFreq) {
            modes.push(numKey);
        }
    }
    if (modes.length === Object.keys(freq).length && modes.length > 1) return [];
    return modes;
};

export const calculateVariance = (data: number[], mean: number): number => {
  return data.map(val => (val - mean) ** 2).reduce((a, b) => a + b, 0) / (data.length - 1);
};

export const calculateStdDev = (variance: number): number => Math.sqrt(variance);

export const calculateRange = (data: number[]): number => Math.max(...data) - Math.min(...data);

export const calculateCV = (stdDev: number, mean: number): number => (stdDev / mean) * 100;

export type FrequencyDistribution = {
  classOrCategory: string;
  fi: number; // Frequência Absoluta
  fri: number; // Frequência Relativa
  friPercent: string; // Frequência Relativa Percentual
  acumPercent: string; // Frequência Acumulada Percentual
};

export function calculateFrequencyDistribution(
  data: (string | number)[],
  isCategorical: boolean = false,
  numBins: number = 10
): FrequencyDistribution[] {
  const total = data.length;
  if (total === 0) return [];

  let counts: Record<string, number> = {};

  if (isCategorical) {
    data.forEach(item => {
      const key = String(item);
      counts[key] = (counts[key] || 0) + 1;
    });
  } else {
    const numericData = data as number[];
    const min = Math.min(...numericData);
    const max = Math.max(...numericData);
    const binWidth = (max - min) / numBins;

    for (let i = 0; i < numBins; i++) {
      const lowerBound = min + i * binWidth;
      const upperBound = min + (i + 1) * binWidth;
      const key = `${lowerBound.toFixed(1)} - ${upperBound.toFixed(1)}`;
      counts[key] = 0;
    }

    numericData.forEach(val => {
      let binIndex = Math.floor((val - min) / binWidth);
      if (val === max) {
        binIndex = numBins - 1;
      }
      const lowerBound = min + binIndex * binWidth;
      const upperBound = min + (binIndex + 1) * binWidth;
      const key = `${lowerBound.toFixed(1)} - ${upperBound.toFixed(1)}`;
      if (counts[key] !== undefined) {
        counts[key]++;
      }
    });
  }

  const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  let cumulativeFreq = 0;
  const distribution: FrequencyDistribution[] = [];

  for (const [classOrCategory, fi] of sortedEntries) {
    const fri = fi / total;
    cumulativeFreq += fri;
    distribution.push({
      classOrCategory,
      fi,
      fri: fri,
      friPercent: `${(fri * 100).toFixed(2)}%`,
      acumPercent: `${(cumulativeFreq * 100).toFixed(2)}%`,
    });
  }

  return distribution;
}

