export function computeIntonationWidth(pitches: number[]): number {
  if (pitches.length < 2) return 0;

  const min = Math.min(...pitches);
  const max = Math.max(...pitches);

  if (min <= 0) return 0;

  return Math.log2(max / min);
}
