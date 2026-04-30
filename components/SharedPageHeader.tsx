"use client";

type SharedPageHeaderProps = {
  title: string;
  description: string;
  email: string | null;
  onSignOut: () => void;
  onToggleLockMode?: () => void;
  isLocked?: boolean;
  lockStatusLoading?: boolean;
  children?: React.ReactNode;
};

export default function SharedPageHeader({
  title,
  description,
  email,
  onSignOut,
  onToggleLockMode,
  isLocked,
  lockStatusLoading,
  children,
}: SharedPageHeaderProps) {
  return (
    <section className="hero">
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="nav">
        <a href="/">Analysis</a>
        <a href="/materials">Materials</a>
        <a href="/analytics">Analytics</a>
        <a href="/logs">Logs</a>
        <a href="/guide">How to Use</a>
        <a href="/about">About</a>
        {onToggleLockMode ? (
          <button type="button" onClick={onToggleLockMode} style={{ maxWidth: "220px", marginLeft: "auto" }}>
            {isLocked ? "Disable Lock" : "Enable Lock"}
          </button>
        ) : null}
        <button type="button" onClick={onSignOut} style={{ width: "fit-content", maxWidth: "none", whiteSpace: "nowrap" }}>
          Sign Out ({email})
        </button>
      </div>
      {lockStatusLoading ? <p className="muted">Checking lock status...</p> : null}
      {isLocked ? <p className="muted" style={{ marginTop: "0.25rem" }}>Lock mode is active — setup pages are read-only.</p> : null}
      {children}
    </section>
  );
}
