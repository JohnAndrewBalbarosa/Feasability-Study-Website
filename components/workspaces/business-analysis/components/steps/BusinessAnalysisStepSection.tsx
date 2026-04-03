import type { CostRow, MaterialProcurementRecommendation, ProductRow, SaveStatus, Step1Data, WeightedBreakEvenSummary } from "../../types";
import type { GraphData, GraphPathData } from "../../selectors/graphSelectors";
import type { ProfitAnalysis, BreakEvenAnalysis } from "../../types";
import type { WeightedBreakEvenTotals } from "../../selectors/weightedSelectors";
import Step1Section from "./Step1Section";
import Step2Section from "./Step2Section";
import Step3Section from "./Step3Section";
import Step4Section from "./Step4Section";
import Step5Section from "./Step5Section";
import Step6Section from "./Step6Section";
import Step7Section from "./Step7Section";
import Step8Section from "./Step8Section";

type InferredVariableCost = {
  variableCostPerItem: number | null;
};

type Props = {
  currentStep: number;
  products: ProductRow[];
  costRows: CostRow[];
  step1Data: Step1Data;
  profitAnalysis: ProfitAnalysis | null;
  breakEvenAnalysis: BreakEvenAnalysis | null;
  graphData: GraphData | null;
  graphPathData: GraphPathData | null;
  weightedBreakEvenSummary: WeightedBreakEvenSummary | null;
  weightedBreakEvenTotals: WeightedBreakEvenTotals | null;
  step8ProfitDisplay: { label: string; amount: number } | null;
  materialProcurementRecommendations: MaterialProcurementRecommendation[];
  saveStatus: SaveStatus;
  profitabilityStatus: string;
  breakEvenInsight: string;
  inferredVariableCostByProduct: Map<string, InferredVariableCost>;
  onUpdateProduct: (id: string, field: keyof ProductRow, value: string) => void;
  onAddProductRow: () => void;
  onRemoveProductRow: (id: string) => void;
  onUpdateCostRow: (id: string, field: keyof CostRow, value: string) => void;
  onAddCostRow: () => void;
  onRemoveCostRow: (id: string) => void;
};

export default function BusinessAnalysisStepSection(props: Props) {
  switch (props.currentStep) {
    case 1:
      return (
        <Step1Section
          products={props.products}
          costRows={props.costRows}
          inferredVariableCostByProduct={props.inferredVariableCostByProduct}
          onUpdateProduct={props.onUpdateProduct}
          onRemoveProductRow={props.onRemoveProductRow}
          onAddProductRow={props.onAddProductRow}
          onUpdateCostRow={props.onUpdateCostRow}
          onRemoveCostRow={props.onRemoveCostRow}
          onAddCostRow={props.onAddCostRow}
        />
      );
    case 2:
      return <Step2Section step1Data={props.step1Data} />;
    case 3:
      return <Step3Section products={props.products} step1Data={props.step1Data} onUpdateProduct={props.onUpdateProduct} />;
    case 4:
      return <Step4Section profitAnalysis={props.profitAnalysis} step1Data={props.step1Data} profitabilityStatus={props.profitabilityStatus} />;
    case 5:
      return <Step5Section breakEvenAnalysis={props.breakEvenAnalysis} breakEvenInsight={props.breakEvenInsight} />;
    case 6:
      return <Step6Section graphData={props.graphData} graphPathData={props.graphPathData} />;
    case 7:
      return <Step7Section weightedBreakEvenSummary={props.weightedBreakEvenSummary} />;
    case 8:
      return (
        <Step8Section
          weightedBreakEvenSummary={props.weightedBreakEvenSummary}
          weightedBreakEvenTotals={props.weightedBreakEvenTotals}
          step8ProfitDisplay={props.step8ProfitDisplay}
          materialProcurementRecommendations={props.materialProcurementRecommendations}
          saveStatus={props.saveStatus}
        />
      );
    default:
      return null;
  }
}
