export function toNumber(raw: string): number | null {
  const cleaned = raw.trim();
  if (!cleaned) {
    return null;
  }

  const value = Number(cleaned);
  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

export function formatPhp(value: number): string {
  if (!Number.isFinite(value)) {
    return "Not reachable";
  }

  return `PHP ${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "Not reachable";
  }

  return Number.isInteger(value) ? value.toLocaleString("en-PH") : value.toLocaleString("en-PH", { maximumFractionDigits: 4 });
}

export function formatPhpCompact(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}₱${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}₱${(abs / 1_000).toFixed(1)}K`;
  return `${sign}₱${Math.round(abs)}`;
}

export function formatNumberCompact(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${Math.round(abs)}`;
}

export function getStep8ProfitDisplay(value: number): { label: string; amount: number } {
  if (value < 0) {
    return {
      label: "Total Needed Contribution To Break-even",
      amount: Math.abs(value)
    };
  }

  return {
    label: "Total Profit",
    amount: value
  };
}
