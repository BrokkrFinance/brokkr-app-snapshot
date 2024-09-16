export function timeDiffIsLessThan(timestampMs0: number, timestampMs1: number, maxDiffMs: number): boolean {
  return Math.abs(timestampMs0 - timestampMs1) < maxDiffMs;
}
