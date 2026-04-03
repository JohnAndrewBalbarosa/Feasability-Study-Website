import { STEP_TITLES } from "../constants";
import { getStepValidationErrors } from "../selectors/validationSelectors";
import type { BreakEvenAnalysis, ProfitAnalysis, Step1Data, UnitsData, WeightedBreakEvenSummary } from "../types";
import type { GraphData, GraphPathData } from "../selectors/graphSelectors";

type Params = {
  currentStep: number;
  setCurrentStep: (value: React.SetStateAction<number>) => void;
  setStepErrors: (value: React.SetStateAction<string[]>) => void;
  businessPagesLocked: boolean;
  step1Data: Step1Data;
  unitsData: UnitsData;
  profitAnalysis: ProfitAnalysis | null;
  breakEvenAnalysis: BreakEvenAnalysis | null;
  graphData: GraphData | null;
  graphPathData: GraphPathData | null;
  weightedBreakEvenSummary: WeightedBreakEvenSummary | null;
};

export function useBusinessAnalysisNavigationHandlers({
  currentStep,
  setCurrentStep,
  setStepErrors,
  businessPagesLocked,
  step1Data,
  unitsData,
  profitAnalysis,
  breakEvenAnalysis,
  graphData,
  graphPathData,
  weightedBreakEvenSummary
}: Params) {
  const goNext = () => {
    const errors = getStepValidationErrors(
      currentStep,
      step1Data,
      unitsData,
      profitAnalysis,
      breakEvenAnalysis,
      graphData,
      graphPathData,
      weightedBreakEvenSummary
    );

    if (errors.length > 0) {
      setStepErrors(errors);
      return;
    }

    setStepErrors([]);
    setCurrentStep((previous) => Math.min(previous + 1, STEP_TITLES.length));
  };

  const goBack = () => {
    if (businessPagesLocked && currentStep === 3) {
      setStepErrors([]);
      setCurrentStep(1);
      return;
    }

    setStepErrors([]);
    setCurrentStep((previous) => Math.max(previous - 1, 1));
  };

  const goToLockedStep3 = () => {
    setStepErrors([]);
    setCurrentStep(3);
  };

  return { goNext, goBack, goToLockedStep3 };
}
