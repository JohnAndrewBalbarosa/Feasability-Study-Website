export function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const NUMBER_FORMATTER = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

export function formatPhp(value: number): string {
  return `PHP ${CURRENCY_FORMATTER.format(value)}`;
}

export function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

export function formatProfitLoss(value: number): string {
  const absolute = Math.abs(value);
  const formatted = `PHP ${CURRENCY_FORMATTER.format(absolute)}`;
  return value < 0 ? `-${formatted}` : formatted;
}

export function formatApiError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const payload = data as { message?: string; details?: string };
  const detail = typeof payload.details === "string" ? payload.details : null;
  const baseMessage = typeof payload.message === "string" ? payload.message : fallback;
  return detail ? `${baseMessage}: ${detail}` : baseMessage;
}
