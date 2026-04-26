import { createContext, useContext } from "react";

import type { FinanceRecord, RecordSnapshot } from "@entities/record";

export type CopiedRecord = {
  copiedAt: string;
  sourceRecordId: string;
  sourceSnapshot: RecordSnapshot;
};

export type RecordClipboardContextValue = {
  copiedRecord: CopiedRecord | null;
  copyRecord: (record: FinanceRecord) => void;
  clearCopiedRecord: () => void;
};

export const recordClipboardStorageKey = "personal-finance-record-clipboard";
export const RecordClipboardContext = createContext<RecordClipboardContextValue | null>(null);

export function useRecordClipboard() {
  const context = useContext(RecordClipboardContext);

  if (!context) {
    throw new Error("useRecordClipboard must be used within RecordClipboardProvider.");
  }

  return context;
}
