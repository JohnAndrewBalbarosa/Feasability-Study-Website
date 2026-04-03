import UserErrorPanel from "@/components/UserErrorPanel";

import { formatPercent, formatPhp } from "../../formatters";
import type { Step1Data } from "../../types";

type Props = {
  step1Data: Step1Data;
};

export default function Step2Section({ step1Data }: Props) {
  return (
    <div>
      <div className="formula-box">
        <p>Formulas:</p>
        <p>Contribution Margin = Selling Price - Variable Cost</p>
        <p>Contribution Margin Ratio = Contribution Margin / Selling Price</p>
      </div>

      {step1Data.errors.length > 0 ? (
        <UserErrorPanel
          title="Step 2 Needs Step 1 Data"
          message="Complete Step 1 with valid product and cost values before unit economics can be computed."
        />
      ) : (
        <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
          <table className="ops-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Selling Price (PHP)</th>
                <th>Variable Cost (PHP)</th>
                <th>Contribution Margin (PHP)</th>
                <th>Contribution Margin Ratio</th>
              </tr>
            </thead>
            <tbody>
              {step1Data.parsedProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.productName}</td>
                  <td>{formatPhp(product.sellingPrice)}</td>
                  <td>{formatPhp(product.variableCost)}</td>
                  <td>{formatPhp(product.contributionMargin)}</td>
                  <td>{formatPercent(product.contributionMarginRatio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
