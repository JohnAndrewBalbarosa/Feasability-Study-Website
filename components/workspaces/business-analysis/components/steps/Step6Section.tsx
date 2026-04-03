import UserErrorPanel from "@/components/UserErrorPanel";

import { GRAPH_PADDING, SVG_HEIGHT, SVG_WIDTH } from "../../constants";
import { formatNumber, formatPhp } from "../../formatters";
import type { GraphData, GraphPathData } from "../../selectors/graphSelectors";

type Props = {
  graphData: GraphData | null;
  graphPathData: GraphPathData | null;
};

export default function Step6Section({ graphData, graphPathData }: Props) {
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

            <text x={SVG_WIDTH / 2 - 45} y={SVG_HEIGHT - 12} fontSize="13" fill="#261a12">
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
