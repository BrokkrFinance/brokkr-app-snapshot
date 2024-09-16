export function range(fromIncl: number, untilExcl: number): number[] {
  return Array.from({ length: untilExcl - fromIncl }, (v, k) => k + fromIncl);
}
