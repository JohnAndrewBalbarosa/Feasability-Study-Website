import UserErrorPanel from "@/components/UserErrorPanel";

import { GRAPH_PADDING, SVG_HEIGHT, SVG_WIDTH } from "../../constants";
import { formatNumber, formatPhp } from "../../formatters";
import type { GraphData, GraphPathData } from "../../selectors/graphSelectors";

type Props = {
  graphData: GraphData | null;
  graphPathData: GraphPathData | null;
};

export default function Step6Section({ graphData, graphPathData }: Props) {
  const intervals = 6;

  return (
    <div>
      <div className="formula-box">
        <p>Graph equations:</p>
        <p>Total Revenue Line = Weighted Average Selling Price x Units Sold</p>
        <p>Total Cost Line = Total Fixed Cost + (Weighted Average Variable Cost x Units Sold)</p>
      </div>

      {!graphData || !graphPathData ? (
        <UserErrorPanel
          title="Step 6 Needs Break-Even Inputs"
          message="Complete Steps 1 to 5 with valid data to generate the required line graph."
        />
      ) : (
        <div className="chart-wrap" style={{ marginTop: "0.8rem" }}>
          <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} role="img" aria-label="Total cost versus total revenue line graph">
            <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill="rgba(255,255,255,0.92)" />

            {Array.from({ length: intervals + 1 }).map((_, index) => {
              const ratio = index / intervals;
              const x = GRAPH_PADDING + ratio * (SVG_WIDTH - GRAPH_PADDING * 2);
              const y = SVG_HEIGHT - GRAPH_PADDING - ratio * (SVG_HEIGHT - GRAPH_PADDING * 2);
              const unitsTick = ratio * graphData.maxUnits;
              const amountTick = ratio * graphData.maxAmount;

              return (
                <g key={`grid-${index}`}>
                  <line x1={x} y1={GRAPH_PADDING} x2={x} y2={SVG_HEIGHT - GRAPH_PADDING} stroke="rgba(16,16,16,0.14)" strokeWidth="1" />
                  <line x1={GRAPH_PADDING} y1={y} x2={SVG_WIDTH - GRAPH_PADDING} y2={y} stroke="rgba(16,16,16,0.14)" strokeWidth="1" />

                  <line x1={x} y1={SVG_HEIGHT - GRAPH_PADDING} x2={x} y2={SVG_HEIGHT - GRAPH_PADDING + 6} stroke="#261a12" strokeWidth="1.5" />
                  <line x1={GRAPH_PADDING - 6} y1={y} x2={GRAPH_PADDING} y2={y} stroke="#261a12" strokeWidth="1.5" />

                  <text x={x} y={SVG_HEIGHT - GRAPH_PADDING + 20} fontSize="10" fill="#261a12" textAnchor="middle">
                    {formatNumber(unitsTick)}
                  </text>
                  <text x={GRAPH_PADDING - 10} y={y + 3} fontSize="10" fill="#261a12" textAnchor="end">
                    {formatNumber(amountTick)}
                  </text>
                </g>
              );
            })}

            <line
              x1={GRAPH_PADDING}
              y1={SVG_HEIGHT - GRAPH_PADDING}
              x2={SVG_WIDTH - GRAPH_PADDING}
              y2={SVG_HEIGHT - GRAPH_PADDING}
              stroke="#261a12"
              strokeWidth="2"
            />
            <line x1={GRAPH_PADDING} y1={GRAPH_PADDING} x2={GRAPH_PADDING} y2={SVG_HEIGHT - GRAPH_PADDING} stroke="#261a12" strokeWidth="2" />

            <path d={graphPathData.revenuePath} fill="none" stroke="#008a8a" strokeWidth="3.5" />
            <path d={graphPathData.costPath} fill="none" stroke="#ea4d2c" strokeWidth="3.5" />

            {graphPathData.breakEvenPoint ? (
              <g>
                <circle cx={graphPathData.breakEvenPoint.x} cy={graphPathData.breakEvenPoint.y} r="6.5" fill="#1c1a17" />
                <text x={graphPathData.breakEvenPoint.x + 10} y={graphPathData.breakEvenPoint.y - 8} fontSize="12" fill="#1c1a17">
                  BEP ({formatNumber(graphPathData.breakEvenPoint.units)} units, {formatPhp(graphPathData.breakEvenPoint.amount)})
                </text>
              </g>
            ) : null}

            <text x={SVG_WIDTH / 2} y={SVG_HEIGHT - 8} fontSize="13" fill="#261a12" textAnchor="middle">
              Units sold
            </text>
            <text x={8} y={22} fontSize="13" fill="#261a12">
              Amount (PHP)
            </text>
          </svg>

          <div className="line-legend">
            <span className="legend-item">
              <span className="legend-dot legend-teal" />
              Total Revenue Line
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-orange" />
              Total Cost Line
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
