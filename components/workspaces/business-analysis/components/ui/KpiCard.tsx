import type { ReactNode } from "react";

type Tone = "neutral" | "positive" | "negative";

type Props = {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: Tone;
  hint?: string;
};

export default function KpiCard({ icon, label, value, tone = "neutral", hint }: Props) {
  return (
    <div className="kpi-card" data-tone={tone}>
      <div className="kpi-card__icon">{icon}</div>
      <div className="kpi-card__label">{label}</div>
      <div className="kpi-card__value">{value}</div>
      {hint ? <div className="kpi-card__hint">{hint}</div> : null}
    </div>
  );
}
