import { formatNumber, formatPhp, formatProfitLoss } from "../formatters";
import type { AnalyticsTotals } from "../types";
import KpiCard from "../../business-analysis/components/ui/KpiCard";
import { IconCashIn, IconAlert, IconTarget, IconBox } from "../../business-analysis/components/ui/Icons";

type AnalyticsTotalsCardProps = {
  totals: AnalyticsTotals;
};

export default function AnalyticsTotalsCard({ totals }: AnalyticsTotalsCardProps) {
  const profitTone = totals.profitSignal >= 0 ? "positive" : "negative";

  return (
    <article className="card">
      <h3 id="analytics-totals-heading">Overall Summary (all loaded records)</h3>
      <div className="kpi-grid">
        <KpiCard
          icon={<IconCashIn size={26} />}
          label="Total Sales (Money In)"
          value={formatPhp(totals.revenue)}
          tone="neutral"
        />
        <KpiCard
          icon={totals.profitSignal >= 0 ? <IconCashIn size={26} /> : <IconAlert size={26} />}
          label="Net Profit / Loss"
          value={formatProfitLoss(totals.profitSignal)}
          tone={profitTone}
          hint={totals.profitSignal < 0 ? "You are still in the red overall." : "You are ahead overall — great!"}
        />
        <KpiCard
          icon={<IconTarget size={26} />}
          label="Units Needed to Break Even"
          value={formatNumber(totals.breakEvenUnits)}
          tone="neutral"
        />
        <KpiCard
          icon={<IconBox size={26} />}
          label="Items Sold (All Records)"
          value={formatNumber(totals.soldUnits)}
          tone="neutral"
        />
        <KpiCard
          icon={<IconAlert size={26} />}
          label="Items Still Short of Target"
          value={formatNumber(totals.deficitUnits)}
          tone={totals.deficitUnits > 0 ? "negative" : "neutral"}
          hint={totals.deficitUnits <= 0 ? "All targets met!" : undefined}
        />
      </div>
    </article>
  );
}
