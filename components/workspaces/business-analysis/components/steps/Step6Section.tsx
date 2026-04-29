"use client";

import { useRef, useState } from "react";
import UserErrorPanel from "@/components/UserErrorPanel";

import { GRAPH_PADDING, SVG_HEIGHT, SVG_WIDTH } from "../../constants";
import { formatNumberCompact, formatPhpCompact } from "../../formatters";
import { buildZonePaths } from "../../selectors/graphSelectors";
import type { GraphData, GraphPathData } from "../../selectors/graphSelectors";
import ChartTooltip from "../ui/ChartTooltip";
import PlainLanguageBox from "../ui/PlainLanguageBox";
import { PLAIN_EXPLANATIONS } from "../../copy";

type Props = {
  graphData: GraphData | null;
  graphPathData: GraphPathData | null;
};

type HoverInfo = {
  svgX: number;
  svgY: number;
  containerX: number;
  containerY: number;
  units: number;
  revenue: number;
  cost: number;
};

export default function Step6Section({ graphData, graphPathData }: Props) {
  const intervals = 6;
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);

  const plotWidth = SVG_WIDTH - GRAPH_PADDING * 2;
  const plotHeight = SVG_HEIGHT - GRAPH_PADDING * 2;

  function handleMouseMove(e: React.MouseEvent<SVGRectElement>) {
    if (!graphData || !svgRef.current) return;
    const svgEl = svgRef.current;
    const rect = svgEl.getBoundingClientRect();
    const scaleX = SVG_WIDTH / rect.width;
    const scaleY = SVG_HEIGHT / rect.height;
    const rawX = (e.clientX - rect.left) * scaleX;
    const rawY = (e.clientY - rect.top) * scaleY;

    const clampedX = Math.max(GRAPH_PADDING, Math.min(SVG_WIDTH - GRAPH_PADDING, rawX));
    const units = ((clampedX - GRAPH_PADDING) / plotWidth) * graphData.maxUnits;

    // derive revenue and cost from the same linear equations the chart uses
    const firstPoint = graphData.points[0];
    const lastPoint = graphData.points[graphData.points.length - 1];
    if (!firstPoint || !lastPoint) return;

    const revenueSlope = lastPoint.totalRevenue / Math.max(lastPoint.units, 1);
    const revenue = revenueSlope * units;

    const costAtZero = graphData.points[0].totalCost;
    const costSlope = (lastPoint.totalCost - costAtZero) / Math.max(lastPoint.units, 1);
    const cost = costAtZero + costSlope * units;

    // position tooltip relative to the container div (not SVG)
    const containerX = e.clientX - rect.left;
    const containerY = e.clientY - rect.top;

    setHover({ svgX: rawX, svgY: rawY, containerX, containerY, units, revenue, cost });
  }

  function handleMouseLeave() {
    setHover(null);
  }

  const zonePaths = graphData && graphPathData ? buildZonePaths(graphData, graphPathData.breakEvenPoint) : null;

  const bep = graphPathData?.breakEvenPoint ?? null;
  const bepOffsetX = bep && bep.x > SVG_WIDTH * 0.65 ? -210 : 12;

  const chartAriaLabel = bep && graphData
    ? `Line chart showing break-even analysis. Revenue line rises from zero. Cost line starts above zero due to fixed costs. Break-even point is at ${formatNumberCompact(bep.units)} items sold and ${formatPhpCompact(bep.amount)} in sales.`
    : "Line chart showing total cost versus total revenue. Complete all steps to see the break-even point.";

  return (
    <div>
      <PlainLanguageBox title="How to read this chart">{PLAIN_EXPLANATIONS.step6}</PlainLanguageBox>

      <details className="detail-toggle" aria-hidden="true">
        <summary>Show chart formulas</summary>
        <div className="formula-box" style={{ marginTop: "0.5rem" }}>
          <p>Total Revenue Line = Weighted Average Selling Price × Units Sold</p>
          <p>Total Cost Line = Total Fixed Cost + (Weighted Average Variable Cost × Units Sold)</p>
        </div>
      </details>

      {!graphData || !graphPathData ? (
        <UserErrorPanel
          title="Chart Needs Break-Even Inputs"
          message="Complete Steps 1 to 5 with valid data to generate the chart."
        />
      ) : (
        <div className="chart-wrap" style={{ marginTop: "0.8rem", position: "relative" }}>
          {hover ? (
            <ChartTooltip
              x={hover.containerX}
              y={hover.containerY}
              visible={true}
              lines={[
                `Units: ${formatNumberCompact(hover.units)}`,
                `Revenue: ${formatPhpCompact(hover.revenue)}`,
                `Cost: ${formatPhpCompact(hover.cost)}`,
                `Margin: ${formatPhpCompact(hover.revenue - hover.cost)}`,
              ]}
            />
          ) : null}

          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            role="img"
            aria-labelledby="chart-title chart-desc"
          >
            <title id="chart-title">Break-even line chart</title>
            <desc id="chart-desc">{chartAriaLabel}</desc>

            <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill="rgba(255,255,255,0.92)" />

            {/* Zone shading — rendered before lines so lines sit on top */}
            {zonePaths ? (
              <>
                <path d={zonePaths.lossZonePath} fill="rgba(217,59,33,0.12)" />
                <path d={zonePaths.profitZonePath} fill="rgba(43,191,94,0.14)" />
              </>
            ) : null}

            {/* Grid lines */}
            {Array.from({ length: intervals + 1 }).map((_, index) => {
              const ratio = index / intervals;
              const x = GRAPH_PADDING + ratio * plotWidth;
              const y = SVG_HEIGHT - GRAPH_PADDING - ratio * plotHeight;
              const unitsTick = ratio * graphData.maxUnits;
              const amountTick = ratio * graphData.maxAmount;

              return (
                <g key={`grid-${index}`}>
                  <line x1={x} y1={GRAPH_PADDING} x2={x} y2={SVG_HEIGHT - GRAPH_PADDING} stroke="rgba(16,16,16,0.12)" strokeWidth="1" />
                  <line x1={GRAPH_PADDING} y1={y} x2={SVG_WIDTH - GRAPH_PADDING} y2={y} stroke="rgba(16,16,16,0.12)" strokeWidth="1" />
                  <line x1={x} y1={SVG_HEIGHT - GRAPH_PADDING} x2={x} y2={SVG_HEIGHT - GRAPH_PADDING + 6} stroke="#261a12" strokeWidth="1.5" />
                  <line x1={GRAPH_PADDING - 6} y1={y} x2={GRAPH_PADDING} y2={y} stroke="#261a12" strokeWidth="1.5" />
                  <text x={x} y={SVG_HEIGHT - GRAPH_PADDING + 20} fontSize="10" fill="#261a12" textAnchor="middle">
                    {formatNumberCompact(unitsTick)}
                  </text>
                  <text x={GRAPH_PADDING - 10} y={y + 3} fontSize="10" fill="#261a12" textAnchor="end">
                    {formatPhpCompact(amountTick)}
                  </text>
                </g>
              );
            })}

            {/* Axes */}
            <line x1={GRAPH_PADDING} y1={SVG_HEIGHT - GRAPH_PADDING} x2={SVG_WIDTH - GRAPH_PADDING} y2={SVG_HEIGHT - GRAPH_PADDING} stroke="#261a12" strokeWidth="2" />
            <line x1={GRAPH_PADDING} y1={GRAPH_PADDING} x2={GRAPH_PADDING} y2={SVG_HEIGHT - GRAPH_PADDING} stroke="#261a12" strokeWidth="2" />

            {/* Zone labels */}
            {zonePaths ? (
              <>
                <text className="chart-zone-label" x={zonePaths.lossCentroid.x} y={zonePaths.lossCentroid.y} fill="#a8341c" textAnchor="middle">
                  Loss Zone
                </text>
                <text className="chart-zone-label" x={zonePaths.profitCentroid.x} y={zonePaths.profitCentroid.y} fill="#1a7a3f" textAnchor="middle">
                  Profit Zone
                </text>
              </>
            ) : null}

            {/* Data lines */}
            <path d={graphPathData.revenuePath} fill="none" stroke="#008a8a" strokeWidth="3.5" />
            <path d={graphPathData.costPath} fill="none" stroke="#ea4d2c" strokeWidth="3.5" />

            {/* Break-even callout */}
            {bep ? (
              <g transform={`translate(${bep.x}, ${bep.y})`}>
                <circle r="7" fill="#101010" stroke="#fff6d6" strokeWidth="2" />
                <line x1="0" y1="0" x2={bepOffsetX > 0 ? bepOffsetX - 2 : bepOffsetX + 197} y2="-44" stroke="#101010" strokeWidth="1.5" />
                <rect x={bepOffsetX} y="-84" width="200" height="66" fill="#fff6d6" stroke="#101010" strokeWidth="2" />
                <text x={bepOffsetX + 10} y="-62" fontSize="12" fontWeight="700" fill="#101010">
                  Break-Even Point
                </text>
                <text x={bepOffsetX + 10} y="-46" fontSize="11" fill="#101010">
                  {formatNumberCompact(bep.units)} items sold
                </text>
                <text x={bepOffsetX + 10} y="-30" fontSize="11" fill="#101010">
                  {formatPhpCompact(bep.amount)} in sales
                </text>
              </g>
            ) : null}

            {/* Axis labels */}
            <text x={SVG_WIDTH / 2} y={SVG_HEIGHT - 8} fontSize="13" fill="#261a12" textAnchor="middle">
              Items sold (units)
            </text>
            <text x={10} y={22} fontSize="13" fill="#261a12">
              Amount (PHP)
            </text>

            {/* Invisible hover target */}
            <rect
              x={GRAPH_PADDING}
              y={GRAPH_PADDING}
              width={plotWidth}
              height={plotHeight}
              fill="transparent"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: "crosshair" }}
            />
          </svg>

          <div className="line-legend">
            <span className="legend-item">
              <span className="legend-dot legend-teal" />
              Money In (Sales / Revenue)
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-orange" />
              Money Out (Total Costs)
            </span>
            <span className="legend-item">
              <span className="legend-swatch" style={{ background: "rgba(43,191,94,0.35)" }} />
              Profit Zone
            </span>
            <span className="legend-item">
              <span className="legend-swatch" style={{ background: "rgba(217,59,33,0.22)" }} />
              Loss Zone
            </span>
            <span className="legend-item">
              <span className="legend-dot" style={{ background: "#101010" }} />
              Break-Even Point
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
