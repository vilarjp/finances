import { useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { apiSessionClearedEventName } from "@shared/api/http-client";

import { recordToSnapshot } from "./forms";
import {
  RecordClipboardContext,
  recordClipboardStorageKey,
  type CopiedRecord,
  type RecordClipboardContextValue,
} from "./record-clipboard-context";

const clipboardTtlMilliseconds = 30 * 60 * 1000;

type StoredCopiedRecord = {
  copiedRecord: CopiedRecord;
  expiresAt: number;
  userId: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function removeStoredCopiedRecord() {
  try {
    window.sessionStorage.removeItem(recordClipboardStorageKey);
  } catch {
    return;
  }
}

function readStoredCopiedRecord(userId: string): CopiedRecord | null {
  try {
    const storedValue = window.sessionStorage.getItem(recordClipboardStorageKey);

    if (!storedValue) {
      return null;
    }

    const parsed = JSON.parse(storedValue) as unknown;

    if (!isRecord(parsed)) {
      removeStoredCopiedRecord();
      return null;
    }

    const storedRecord = parsed as Partial<StoredCopiedRecord>;
    const copiedRecordCandidate = storedRecord.copiedRecord;

    if (
      storedRecord.userId !== userId ||
      typeof storedRecord.expiresAt !== "number" ||
      storedRecord.expiresAt <= Date.now() ||
      !isRecord(copiedRecordCandidate) ||
      typeof copiedRecordCandidate.copiedAt !== "string" ||
      typeof copiedRecordCandidate.sourceRecordId !== "string" ||
      !isRecord(copiedRecordCandidate.sourceSnapshot)
    ) {
      removeStoredCopiedRecord();
      return null;
    }

    return copiedRecordCandidate;
  } catch {
    removeStoredCopiedRecord();
    return null;
  }
}

function storeCopiedRecord(userId: string, copiedRecord: CopiedRecord | null) {
  try {
    if (copiedRecord) {
      const storedRecord: StoredCopiedRecord = {
        copiedRecord,
        expiresAt: Date.now() + clipboardTtlMilliseconds,
        userId,
      };

      window.sessionStorage.setItem(recordClipboardStorageKey, JSON.stringify(storedRecord));
      return;
    }

    removeStoredCopiedRecord();
  } catch {
    return;
  }
}

type RecordClipboardProviderProps = PropsWithChildren<{
  userId: string;
}>;

export function RecordClipboardProvider({ children, userId }: RecordClipboardProviderProps) {
  const [copiedRecord, setCopiedRecord] = useState<CopiedRecord | null>(() =>
    readStoredCopiedRecord(userId),
  );

  useEffect(() => {
    const clearClipboard = () => {
      setCopiedRecord(null);
      removeStoredCopiedRecord();
    };

    globalThis.addEventListener?.(apiSessionClearedEventName, clearClipboard);

    return () => {
      clearClipboard();
      globalThis.removeEventListener?.(apiSessionClearedEventName, clearClipboard);
    };
  }, []);

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
        storeCopiedRecord(userId, nextCopiedRecord);
      },
      clearCopiedRecord: () => {
        setCopiedRecord(null);
        storeCopiedRecord(userId, null);
      },
    }),
    [copiedRecord, userId],
  );

  return (
    <RecordClipboardContext.Provider value={value}>{children}</RecordClipboardContext.Provider>
  );
}
