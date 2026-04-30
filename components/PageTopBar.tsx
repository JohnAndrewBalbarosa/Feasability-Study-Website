"use client";

type PageTopBarProps = {
  email?: string | null;
  onSignOut?: () => void;
  onToggleLockMode?: () => void;
  isLocked?: boolean;
  lockStatusLoading?: boolean;
};

export default function PageTopBar({ email, onSignOut, onToggleLockMode, isLocked, lockStatusLoading }: PageTopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <a href="/" className="topbar__brand">
          N·E·W
        </a>

        <nav className="topbar__nav" aria-label="Main navigation">
          <a href="/">Analysis</a>
          <a href="/materials">Materials</a>
          <a href="/analytics">Analytics</a>
          <a href="/logs">Logs</a>
        </nav>

        <div className="topbar__actions">
          <a href="/guide" className="topbar__help" title="How to Use This App" aria-label="How to Use This App">
            ?
          </a>
          {onToggleLockMode ? (
            <button type="button" className="topbar__lock-btn" onClick={onToggleLockMode}>
              {isLocked ? "Unlock" : "Lock"}
            </button>
          ) : null}
          {onSignOut && email ? (
            <button type="button" className="topbar__signout-btn" onClick={onSignOut}>
              Sign Out
            </button>
          ) : null}
        </div>
      </div>

      {lockStatusLoading ? <div className="topbar__lock-notice">Checking lock status…</div> : null}
      {!lockStatusLoading && isLocked ? (
        <div className="topbar__lock-notice">Lock mode on — Steps 1 &amp; 2 are read-only</div>
      ) : null}
    </header>
  );
}
