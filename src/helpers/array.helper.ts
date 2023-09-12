export function ChunkArray<T>(arr: T[], chunkSize: number): T[][] {
  if (arr == null) return [];

  if (!Array.isArray(arr)) {
    arr = [arr];
  }

  const chunks = [];

  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }

  return chunks;
}
