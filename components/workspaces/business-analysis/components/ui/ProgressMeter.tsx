import { formatNumber } from "../../formatters";

type Props = {
  current: number;
  target: number;
  label: string;
};

export default function ProgressMeter({ current, target, label }: Props) {
  const safeTarget = target > 0 ? target : 1;
  const ratio = current / safeTarget;
  const pct = Math.min(ratio * 100, 100);
  const overshoot = ratio >= 1;
  const displayPct = Math.round(ratio * 100);

  return (
    <div className="progress-meter" aria-label={label}>
      <div className="progress-meter__bar" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={target} aria-label={label}>
        <div className="progress-meter__fill" data-overshoot={overshoot ? "true" : "false"} style={{ width: `${pct}%` }} />
      </div>
      <p className="progress-meter__caption">
        {overshoot ? (
          <>
            You have sold <strong>{formatNumber(current)}</strong> items — that is{" "}
            <strong>{formatNumber(current - target)}</strong> past break-even. Great job!
          </>
        ) : (
          <>
            You have sold <strong>{formatNumber(current)}</strong> items. You need{" "}
            <strong>{formatNumber(target)}</strong> to break even. You are{" "}
            <strong className="progress-meter__pct">{displayPct}%</strong> of the way there.
          </>
        )}
      </p>
    </div>
  );
}
