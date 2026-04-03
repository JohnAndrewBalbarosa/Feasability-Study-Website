import { formatNumber, formatPhp, formatProfitLoss } from "../formatters";
import type { AnalyticsTotals } from "../types";

type AnalyticsTotalsCardProps = {
  totals: AnalyticsTotals;
};

export default function AnalyticsTotalsCard({ totals }: AnalyticsTotalsCardProps) {
  return (
    <article className="card">
      <h3>Totals (all loaded basis records)</h3>
      <p>
        Total Revenue: <strong>{formatPhp(totals.revenue)}</strong>
      </p>
      <p>
        Total Overall Historical Profit / Loss: <strong>{formatProfitLoss(totals.profitSignal)}</strong>
      </p>
      <p className="muted">Negative means business is in the red; positive means net profit overall.</p>
      <p>
        Total Weighted Break-even Units: <strong>{formatNumber(totals.breakEvenUnits)}</strong>
      </p>
      <p>
        Total Units Sold: <strong>{formatNumber(totals.soldUnits)}</strong>
      </p>
      <p>
        Total Deficit Units: <strong>{formatNumber(totals.deficitUnits)}</strong>
      </p>
    </article>
  );
}
