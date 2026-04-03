export function toNumber(raw: string): number | null {
  const value = Number(raw.trim());
  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

export function normalizeMaterial(value: string): string {
  return value.trim().toLowerCase();
}

export function formatPhp(value: number): string {
  return `PHP ${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
