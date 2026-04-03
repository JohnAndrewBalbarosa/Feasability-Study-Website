type StepNavigatorProps = {
  stepTitles: string[];
  currentStep: number;
  isLocked: boolean;
  lockStatusLoading: boolean;
  onStepChange: (step: number) => void;
};

export default function StepNavigator({ stepTitles, currentStep, isLocked, lockStatusLoading, onStepChange }: StepNavigatorProps) {
  return (
    <>
      <h2>{stepTitles[currentStep - 1]}</h2>
      <p className="muted">
        Progress step {currentStep} of {stepTitles.length}
      </p>

      {lockStatusLoading ? <p className="muted">Checking lock status from Supabase...</p> : null}
      {isLocked ? <p className="muted" style={{ marginTop: "0.45rem" }}>Lock mode is active.</p> : null}

      <div className="stepper" aria-label="Business analysis steps">
        {stepTitles.map((title, index) => {
          const step = index + 1;
          const className = step === currentStep ? "step-pill active" : step < currentStep ? "step-pill done" : "step-pill";
          const stepLocked = isLocked && step < 3;

          return (
            <button
              key={title}
              type="button"
              className={className}
              onClick={() => {
                if (!stepLocked) {
                  onStepChange(step);
                }
              }}
              aria-current={step === currentStep ? "step" : undefined}
              disabled={stepLocked}
            >
              {step}
            </button>
          );
        })}
      </div>
    </>
  );
}
