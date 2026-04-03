import UserErrorPanel from "@/components/UserErrorPanel";

import type { ProductRow, Step1Data } from "../../types";

type Props = {
  products: ProductRow[];
  step1Data: Step1Data;
  onUpdateProduct: (id: string, field: keyof ProductRow, value: string) => void;
};

export default function Step3Section({ products, step1Data, onUpdateProduct }: Props) {
  return (
    <div>
      <p className="muted">Required input: enter units sold today for each product.</p>

      {step1Data.errors.length > 0 ? (
        <UserErrorPanel
          title="Step 3 Needs Step 1 Data"
          message="Complete Step 1 first so products are defined before entering units sold."
        />
      ) : (
        <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
          <table className="ops-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Units Sold Today</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.productName || "Unnamed Product"}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={product.unitsSoldToday}
                      onChange={(event) => onUpdateProduct(product.id, "unitsSoldToday", event.target.value)}
                      placeholder="0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
