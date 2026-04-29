type Props = {
  status: "profit" | "loss";
};

export default function StatusBadge({ status }: Props) {
  return (
    <span className="status-badge" data-status={status} aria-label={status === "profit" ? "Profit or break-even" : "Loss"}>
      {status === "profit" ? "✓ Profit" : "✗ Loss"}
    </span>
  );
}
