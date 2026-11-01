export interface LineDiff {
  added: number;
  removed: number;
  changedLines: Set<number>;
}

/** Line-level diff of candidate against baseline. `changedLines` holds 1-based candidate line numbers. */
export function diffLines(baseline: string, candidate: string): LineDiff {
  const a = baseline.split('\n');
  const b = candidate.split('\n');
  const width = b.length + 1;
  const lcs = new Uint16Array((a.length + 1) * width);

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i * width + j] =
        a[i].trim() === b[j].trim()
          ? lcs[(i + 1) * width + j + 1] + 1
          : Math.max(lcs[(i + 1) * width + j], lcs[i * width + j + 1]);
    }
  }

  const changedLines = new Set<number>();
  let unchanged = 0;
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i].trim() === b[j].trim()) {
      unchanged++;
      i++;
      j++;
    } else if (lcs[(i + 1) * width + j] >= lcs[i * width + j + 1]) {
      i++;
    } else {
      changedLines.add(j + 1);
      j++;
    }
  }
  for (; j < b.length; j++) changedLines.add(j + 1);

  return {
    added: changedLines.size,
    removed: a.length - unchanged,
    changedLines,
  };
}
