"use client";

type UserErrorPanelProps = {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function UserErrorPanel({
  title = "Something Needs Attention",
  message,
  actionLabel = "Try Again",
  onAction
}: UserErrorPanelProps) {
  return (
    <section className="error-stage" role="alert" aria-live="assertive">
      <article className="neo-error-card">
        <h2>{title}</h2>
        <p>{message}</p>
        {onAction ? (
          <button type="button" onClick={onAction} style={{ maxWidth: "180px", marginTop: "0.75rem" }}>
            {actionLabel}
          </button>
        ) : null}
      </article>
    </section>
  );
}
