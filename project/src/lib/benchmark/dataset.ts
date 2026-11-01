export interface DataRecord {
  key: number;
  value: number;
}

export interface Dataset {
  records: DataRecord[];
  queries: number[];
}

export interface DatasetSpec {
  size: number;
  queries: number;
  seed: number;
}

function createRandom(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

export function generateDataset({ size, queries, seed }: DatasetSpec): Dataset {
  const random = createRandom(seed);
  const keySpace = Math.max(size * 4, 16);
  const used = new Set<number>();
  const records: DataRecord[] = [];

  while (records.length < size) {
    const key = Math.floor(random() * keySpace);
    if (used.has(key)) continue;
    used.add(key);
    records.push({ key, value: Math.floor(random() * 1_000_000) });
  }

  const keys = records.map((record) => record.key);
  const queryKeys: number[] = [];
  for (let i = 0; i < queries; i++) {
    const hit = random() < 0.6 && keys.length > 0;
    queryKeys.push(hit ? keys[Math.floor(random() * keys.length)] : keySpace + Math.floor(random() * keySpace));
  }

  return { records, queries: queryKeys };
}

export const INPUT_SIZES = [
  { label: '1k records', size: 1000 },
  { label: '5k records', size: 5000 },
  { label: '20k records', size: 20000 },
] as const;

export const QUERY_COUNT = 400;
export const INPUT_SEED = 20260;
