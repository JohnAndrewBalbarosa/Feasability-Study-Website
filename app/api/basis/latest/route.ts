import { NextResponse } from "next/server";

import { authorizeOrgSession } from "@/lib/authServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type ProductSnapshot = {
  productName: string;
  packSize: string;
  sellingPrice: number;
  unitsSoldToday: number;
};

type CostSnapshot = {
  costName: string;
  amount: number;
  isBudget: boolean;
};

type MaterialSnapshot = {
  product: string;
  material: string;
  quantityNeededPerProduct: number;
};

type ProcurementSnapshot = {
  material: string;
  unit: string;
  totalAvailable: number;
  totalProcurementCost: number;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseBusinessSnapshot(rawData: unknown): { products: ProductSnapshot[]; costRows: CostSnapshot[] } {
  if (!Array.isArray(rawData)) {
    return { products: [], costRows: [] };
  }

  const products: ProductSnapshot[] = [];
  const seenProducts = new Set<string>();
  let costRows: CostSnapshot[] = [];

  rawData.forEach((item) => {
    if (!item || typeof item !== "object") {
      return;
    }

    const row = item as Record<string, unknown>;
    const productName = asString(row.productName);
    const packSize = asString(row.packSize);
    const sellingPrice = asNumber(row.revenuePerItem);
    const unitsSoldToday = asNumber(row.actualUnitsSoldToday);

    if (productName && sellingPrice !== null && unitsSoldToday !== null) {
      const key = productName.toLowerCase();
      if (!seenProducts.has(key)) {
        seenProducts.add(key);
        products.push({
          productName,
          packSize,
          sellingPrice,
          unitsSoldToday
        });
      }
    }

    if (costRows.length > 0) {
      return;
    }

    const rawCostRows = row.step1CostRows;
    if (!Array.isArray(rawCostRows)) {
      return;
    }

    costRows = rawCostRows
      .map((costItem) => {
        if (!costItem || typeof costItem !== "object") {
          return null;
        }

        const cost = costItem as Record<string, unknown>;
        const costName = asString(cost.costName);
        const amount = asNumber(cost.amount);
        const isBudget = Boolean(cost.isBudget);

        if (!costName || amount === null || amount < 0) {
          return null;
        }

        return { costName, amount, isBudget };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  });

  return { products, costRows };
}

function parseMaterialsSnapshot(rawData: unknown): MaterialSnapshot[] {
  if (!Array.isArray(rawData)) {
    return [];
  }

  return rawData
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const row = item as Record<string, unknown>;
      const product = asString(row.product);
      const material = asString(row.material);
      const quantityNeededPerProduct = asNumber(row.quantityNeededPerProduct);

      if (!product || !material || quantityNeededPerProduct === null || quantityNeededPerProduct <= 0) {
        return null;
      }

      return {
        product,
        material,
        quantityNeededPerProduct
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

function parseProcurementSnapshot(rawData: unknown): ProcurementSnapshot[] {
  if (!Array.isArray(rawData)) {
    return [];
  }

  return rawData
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const row = item as Record<string, unknown>;
      const material = asString(row.material);
      const unit = asString(row.unit) || "unit";
      const totalAvailable = asNumber(row.totalAvailable);
      const totalProcurementCost = asNumber(row.totalProcurementCost);

      if (!material || totalAvailable === null || totalAvailable <= 0 || totalProcurementCost === null || totalProcurementCost < 0) {
        return null;
      }

      return {
        material,
        unit,
        totalAvailable,
        totalProcurementCost
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

export async function GET(request: Request) {
  const authResult = await authorizeOrgSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const [businessResult, materialsResult, procurementResult] = await Promise.all([
    supabaseAdmin.from("business_analysis_data").select("id, created_at, data").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin.from("materials_data").select("id, created_at, data").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin.from("procurement_data").select("id, created_at, data").order("created_at", { ascending: false }).limit(1).maybeSingle()
  ]);

  if (businessResult.error) {
    return NextResponse.json({ message: `Failed to load latest business snapshot: ${businessResult.error.message}` }, { status: 500 });
  }

  if (materialsResult.error) {
    return NextResponse.json({ message: `Failed to load latest materials snapshot: ${materialsResult.error.message}` }, { status: 500 });
  }

  if (procurementResult.error) {
    return NextResponse.json({ message: `Failed to load latest procurement snapshot: ${procurementResult.error.message}` }, { status: 500 });
  }

  const businessSnapshot = parseBusinessSnapshot(businessResult.data?.data);
  const materialsSnapshot = parseMaterialsSnapshot(materialsResult.data?.data);
  const procurementSnapshot = parseProcurementSnapshot(procurementResult.data?.data);

  return NextResponse.json(
    {
      business: businessSnapshot,
      materials: materialsSnapshot,
      procurement: procurementSnapshot,
      hasAnySnapshot:
        businessSnapshot.products.length > 0 ||
        businessSnapshot.costRows.length > 0 ||
        materialsSnapshot.length > 0 ||
        procurementSnapshot.length > 0
    },
    { status: 200 }
  );
}
