export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function formatScore(value: number) {
  return value.toFixed(3);
}

export function formatCount(value: number) {
  return value.toLocaleString();
}
