type BusinessHeroProps = {
  email: string | null;
  isLocked: boolean;
  onToggleLockMode: () => void;
  onSignOut: () => void;
};

export default function BusinessHero({ email, isLocked, onToggleLockMode, onSignOut }: BusinessHeroProps) {
  return (
    <section className="hero">
      <h1>N.E.W Business Analysis Assistant</h1>
      <p>
        Enter your products and costs once, then fill in today&apos;s sales. The system will automatically calculate your
        profit, break-even point, and what you need to procure.
      </p>

      <details className="detail-toggle" style={{ marginTop: "0.65rem" }}>
        <summary>How does this work?</summary>
        <div className="hero-guide">
          <div className="hero-guide__step">
            <span className="hero-guide__num">1</span>
            <span>
              <strong>Setup (once):</strong> Fill in your products, monthly costs, and material requirements (Steps 1–2 and the Materials page).
            </span>
          </div>
          <div className="hero-guide__step">
            <span className="hero-guide__num">2</span>
            <span>
              <strong>Daily:</strong> Come back each day, enter how much you sold (Step 3), and work through Steps 4–8.
            </span>
          </div>
          <div className="hero-guide__step">
            <span className="hero-guide__num">3</span>
            <span>
              <strong>Review:</strong> After saving (Step 8), check the Analytics page to track your trends over time.
            </span>
          </div>
        </div>
      </details>

      <div className="nav">
        <a href="/">Analysis</a>
        <a href="/materials">Materials</a>
        <a href="/analytics">Analytics</a>
        <a href="/logs">Logs</a>
        <a href="/guide">How to Use</a>
        <a href="/about">About</a>
        <button type="button" onClick={onToggleLockMode} style={{ maxWidth: "220px", marginLeft: "auto" }}>
          {isLocked ? "Disable Lock" : "Enable Lock"}
        </button>
        <button type="button" onClick={onSignOut} style={{ width: "fit-content", maxWidth: "none", whiteSpace: "nowrap" }}>
          Sign Out ({email})
        </button>
      </div>
    </section>
  );
}
