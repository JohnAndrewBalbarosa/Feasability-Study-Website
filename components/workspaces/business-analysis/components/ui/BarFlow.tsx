import { formatPhp } from "../../formatters";

type Tone = "revenue" | "varcost" | "fixed" | "positive" | "negative";

type Step = {
  label: string;
  value: number;
  tone: Tone;
};

type Props = {
  steps: Step[];
  max: number;
};

export default function BarFlow({ steps, max }: Props) {
  const safeMax = max > 0 ? max : 1;

  return (
    <div className="bar-flow" role="list" aria-label="Profit and loss breakdown">
      {steps.map((step) => {
        const pct = Math.min((step.value / safeMax) * 100, 100);
        return (
          <div key={step.label} className="bar-flow__row" role="listitem">
            <span className="bar-flow__label">{step.label}</span>
            <div className="bar-flow__track" aria-hidden="true">
              <div className="bar-flow__fill" data-tone={step.tone} style={{ width: `${pct}%` }} />
            </div>
            <span className="bar-flow__amount">{formatPhp(step.value)}</span>
          </div>
        );
      })}
    </div>
  );
}
