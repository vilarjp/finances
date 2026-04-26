import { useMemo, useState, type PropsWithChildren } from "react";

import { recordToSnapshot } from "./forms";
import {
  RecordClipboardContext,
  recordClipboardStorageKey,
  type CopiedRecord,
  type RecordClipboardContextValue,
} from "./record-clipboard-context";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readStoredCopiedRecord(): CopiedRecord | null {
  try {
    const storedValue = window.sessionStorage.getItem(recordClipboardStorageKey);

    if (!storedValue) {
      return null;
    }

    const parsed = JSON.parse(storedValue) as unknown;

    if (
      !isRecord(parsed) ||
      typeof parsed.copiedAt !== "string" ||
      typeof parsed.sourceRecordId !== "string" ||
      !isRecord(parsed.sourceSnapshot)
    ) {
      return null;
    }

    return parsed as CopiedRecord;
  } catch {
    return null;
  }
}

function storeCopiedRecord(copiedRecord: CopiedRecord | null) {
  try {
    if (copiedRecord) {
      window.sessionStorage.setItem(recordClipboardStorageKey, JSON.stringify(copiedRecord));
      return;
    }

    window.sessionStorage.removeItem(recordClipboardStorageKey);
  } catch {
    return;
  }
}

export function RecordClipboardProvider({ children }: PropsWithChildren) {
  const [copiedRecord, setCopiedRecord] = useState<CopiedRecord | null>(() =>
    readStoredCopiedRecord(),
  );

  const value = useMemo<RecordClipboardContextValue>(
    () => ({
      copiedRecord,
      copyRecord: (record) => {
        const nextCopiedRecord = {
          copiedAt: new Date().toISOString(),
          sourceRecordId: record.id,
          sourceSnapshot: recordToSnapshot(record),
        };

        setCopiedRecord(nextCopiedRecord);
        storeCopiedRecord(nextCopiedRecord);
      },
      clearCopiedRecord: () => {
        setCopiedRecord(null);
        storeCopiedRecord(null);
      },
    }),
    [copiedRecord],
  );

  return (
    <RecordClipboardContext.Provider value={value}>{children}</RecordClipboardContext.Provider>
  );
}
