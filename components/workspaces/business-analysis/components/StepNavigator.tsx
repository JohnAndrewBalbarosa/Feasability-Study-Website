const PHASES = [
  { label: "One-Time Setup", steps: [1, 2] },
  { label: "Today's Numbers", steps: [3, 4, 5, 6] },
  { label: "Review & Save", steps: [7, 8] },
];

type StepNavigatorProps = {
  stepTitles: string[];
  currentStep: number;
  isLocked: boolean;
  onStepChange: (step: number) => void;
};

export default function StepNavigator({ stepTitles, currentStep, isLocked, onStepChange }: StepNavigatorProps) {
  return (
    <>
      <h2>{stepTitles[currentStep - 1]}</h2>

      <div className="stepper-wrap" aria-label="Business analysis steps" role="navigation">
        {PHASES.map((phase) => (
          <div key={phase.label} className="stepper-phase">
            <div className="stepper-phase__label">{phase.label}</div>
            <div className="stepper">
              {phase.steps.map((step) => {
                const title = stepTitles[step - 1] ?? `Step ${step}`;
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
                    aria-label={`${title}${step < currentStep ? " (completed)" : ""}${stepLocked ? " (locked)" : ""}`}
                    disabled={stepLocked}
                  >
                    {step}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
