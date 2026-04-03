import { useState, type Dispatch, type SetStateAction } from "react";

import { getSessionAuthHeaders } from "@/lib/authClient";

import { formatApiError } from "../formatters";
import type { BasisRecord } from "../types";

type UseAnalyticsActionsParams = {
  selectedRecordIdsInitial?: string[];
  records: BasisRecord[];
  setRecords: Dispatch<SetStateAction<BasisRecord[]>>;
  setError: Dispatch<SetStateAction<string | null>>;
};

export function useAnalyticsActions({ selectedRecordIdsInitial = [], records, setRecords, setError }: UseAnalyticsActionsParams) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>(selectedRecordIdsInitial);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  const toggleRecordSelection = (recordId: string) => {
    setSelectedRecordIds((previous) =>
      previous.includes(recordId) ? previous.filter((id) => id !== recordId) : [...previous, recordId]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedRecordIds.length === 0) {
      return;
    }

    try {
      setIsDeletingSelected(true);
      setError(null);
      const headers = await getSessionAuthHeaders();

      const results = await Promise.all(
        selectedRecordIds.map(async (recordId) => {
          const response = await fetch(`/api/basis/${encodeURIComponent(recordId)}`, { method: "DELETE", headers });
          const data = await response.json().catch(() => null);

          if (!response.ok) {
            return {
              recordId,
              ok: false,
              message: formatApiError(data, "Failed to delete basis record")
            } as const;
          }

          return { recordId, ok: true, message: "" } as const;
        })
      );

      const deletedIds = results.filter((result) => result.ok).map((result) => result.recordId);
      const failed = results.filter((result) => !result.ok);

      if (deletedIds.length > 0) {
        setRecords((previous) => previous.filter((record) => !deletedIds.includes(record.id)));
      }

      if (failed.length > 0) {
        setSelectedRecordIds(failed.map((item) => item.recordId));
        setError(`Deleted ${deletedIds.length} record(s), failed ${failed.length}: ${failed[0].message}`);
        return;
      }

      setSelectedRecordIds([]);
      setDeleteModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete selected records");
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const openDeleteModal = () => {
    if (records.length > 0) {
      setDeleteModalOpen(true);
    }
  };

  const closeDeleteModal = () => {
    if (!isDeletingSelected) {
      setDeleteModalOpen(false);
    }
  };

  return {
    deleteModalOpen,
    selectedRecordIds,
    isDeletingSelected,
    toggleRecordSelection,
    handleDeleteSelected,
    openDeleteModal,
    closeDeleteModal,
    setDeleteModalOpen
  };
}
