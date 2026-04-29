type Props = {
  x: number;
  y: number;
  lines: string[];
  visible: boolean;
};

export default function ChartTooltip({ x, y, lines, visible }: Props) {
  return (
    <div
      className="chart-tooltip"
      data-visible={visible ? "true" : "false"}
      style={{ left: x, top: y }}
      role="tooltip"
      aria-hidden={!visible}
    >
      {lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </div>
  );
}
