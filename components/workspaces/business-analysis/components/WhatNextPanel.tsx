type Props = {
  onStartNew: () => void;
};

export default function WhatNextPanel({ onStartNew }: Props) {
  return (
    <div className="what-next-panel" role="region" aria-label="Next steps after saving">
      <div className="what-next-panel__title">
        <span className="what-next-panel__check">✓</span> Record saved successfully!
      </div>
      <p className="what-next-panel__prompt">What would you like to do next?</p>
      <div className="what-next-panel__actions">
        <a href="/analytics" className="what-next-action">
          <span className="what-next-action__icon">📊</span>
          <span className="what-next-action__body">
            <strong>View Analytics</strong>
            <span>See how today compares to your history</span>
          </span>
        </a>
        <a href="/materials" className="what-next-action">
          <span className="what-next-action__icon">📦</span>
          <span className="what-next-action__body">
            <strong>Update Materials</strong>
            <span>Adjust your procurement plan</span>
          </span>
        </a>
        <button type="button" className="what-next-action what-next-action--btn" onClick={onStartNew}>
          <span className="what-next-action__icon">↩</span>
          <span className="what-next-action__body">
            <strong>Start a New Entry</strong>
            <span>Go back to Step 3 for tomorrow&apos;s numbers</span>
          </span>
        </button>
      </div>
    </div>
  );
}
