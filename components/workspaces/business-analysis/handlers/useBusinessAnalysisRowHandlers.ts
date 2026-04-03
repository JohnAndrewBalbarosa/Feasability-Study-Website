import type { CostRow, ProcurementRow, ProductRow } from "../types";

type Params = {
  products: ProductRow[];
  setProducts: (value: React.SetStateAction<ProductRow[]>) => void;
  nextProductId: number;
  setNextProductId: (value: React.SetStateAction<number>) => void;
  setCostRows: (value: React.SetStateAction<CostRow[]>) => void;
  nextCostId: number;
  setNextCostId: (value: React.SetStateAction<number>) => void;
  procurementRows: ProcurementRow[];
  setProcurementRows: (value: React.SetStateAction<ProcurementRow[]>) => void;
  nextProcurementId: number;
  setNextProcurementId: (value: React.SetStateAction<number>) => void;
};

export function useBusinessAnalysisRowHandlers({
  products,
  setProducts,
  nextProductId,
  setNextProductId,
  setCostRows,
  nextCostId,
  setNextCostId,
  procurementRows,
  setProcurementRows,
  nextProcurementId,
  setNextProcurementId
}: Params) {
  const updateProduct = (id: string, field: keyof ProductRow, value: string) => {
    setProducts((previous) => previous.map((product) => (product.id === id ? { ...product, [field]: value } : product)));
  };

  const addProductRow = () => {
    const newId = `p-${nextProductId}`;
    setProducts((previous) => [...previous, { id: newId, productName: "", packSize: "", sellingPrice: "", variableCost: "", unitsSoldToday: "" }]);
    setNextProductId((prev) => prev + 1);
  };

  const removeProductRow = (id: string) => {
    setProducts((previous) => (previous.length > 1 ? previous.filter((product) => product.id !== id) : previous));
  };

  const updateCostRow = (id: string, field: keyof CostRow, value: string) => {
    setCostRows((previous) => previous.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addCostRow = () => {
    const newId = `cost-extra-${nextCostId}`;
    setCostRows((previous) => [...previous, { id: newId, costName: "", amount: "" }]);
    setNextCostId((prev) => prev + 1);
  };

  const removeCostRow = (id: string) => {
    setCostRows((previous) => previous.filter((row) => row.id !== id || row.isBudget));
  };

  const updateProcurementRow = (id: string, field: keyof ProcurementRow, value: string) => {
    setProcurementRows((previous) => previous.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addProcurementRow = () => {
    const id = `pr-${nextProcurementId}`;
    setProcurementRows((previous) => [...previous, { id, material: "", unit: "unit", totalAvailable: "", totalProcurementCost: "" }]);
    setNextProcurementId((prev) => prev + 1);
  };

  const removeProcurementRow = (id: string) => {
    setProcurementRows((previous) => (previous.length > 1 ? previous.filter((row) => row.id !== id) : previous));
  };

  return {
    updateProduct,
    addProductRow,
    removeProductRow,
    updateCostRow,
    addCostRow,
    removeCostRow,
    updateProcurementRow,
    addProcurementRow,
    removeProcurementRow,
    hasSingleProduct: products.length <= 1,
    hasSingleProcurementRow: procurementRows.length <= 1
  };
}
