type BusinessHeroProps = {
  email: string | null;
  onToggleLockMode: () => void;
  onSignOut: () => void;
};

export default function BusinessHero({ email, onToggleLockMode, onSignOut }: BusinessHeroProps) {
  return (
    <section className="hero">
      <h1>Wilson Business Analysis Assistant</h1>
      <p>This assistant enforces a strict, step-by-step flow. Missing values stop progression and are requested directly inside this website.</p>
      <div className="nav">
        <a href="/">Summary Dashboard</a>
        <a href="/materials">Material Requirements</a>
        <a href="/analytics">Detailed Analytics</a>
        <button type="button" onClick={onToggleLockMode} style={{ maxWidth: "220px", marginLeft: "auto" }}>
          Enable Lock
        </button>
        <button type="button" onClick={onSignOut} style={{ maxWidth: "220px" }}>
          Sign Out ({email})
        </button>
      </div>
    </section>
  );
}
