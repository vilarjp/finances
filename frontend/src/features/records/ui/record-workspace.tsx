import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardCopy, ClipboardPaste, Edit3, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  RecordCard,
  invalidateFinanceData,
  useRecordsQuery,
  type FinanceRecord,
} from "@entities/record";
import { getApiErrorMessage } from "@shared/api/errors";
import { formatFinanceDate, formatFinanceMonth, getFinanceMonthDateRange } from "@shared/lib/date";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";

import { createRecord, deleteRecord, pasteRecord, updateRecord } from "../api/record-api";
import type { RecordMutationPayload } from "../model/forms";
import { useRecordClipboard } from "../model/record-clipboard-context";
import { RecordEditor, type RecurringValueControlsRenderProps } from "./record-editor";

type EditorState =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      record: FinanceRecord;
    };

type CreateRecordLocationState = {
  createRecordRequestId?: unknown;
};

type RecordWorkspaceProps = {
  renderRecurringValueControls?: (props: RecurringValueControlsRenderProps) => ReactNode;
};

function getCurrentMonthRange() {
  const now = new Date();
  const today = formatFinanceDate(now);
  const { from, to } = getFinanceMonthDateRange(formatFinanceMonth(now));

  return {
    from,
    today,
    to,
  };
}

function getErrorMessage(error: unknown) {
  return getApiErrorMessage(error, "Record request failed.");
}

function getCreateRecordRequestId(state: unknown) {
  if (typeof state !== "object" || state === null) {
    return null;
  }

  const { createRecordRequestId } = state as CreateRecordLocationState;

  return typeof createRecordRequestId === "number" ? createRecordRequestId : null;
}

export function RecordWorkspace({ renderRecurringValueControls }: RecordWorkspaceProps) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const initialRange = useMemo(() => getCurrentMonthRange(), []);
  const recordsQuery = useRecordsQuery({
    from: initialRange.from,
    to: initialRange.to,
  });
  const { copiedRecord, copyRecord } = useRecordClipboard();
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [editorError, setEditorError] = useState("");
  const [summary, setSummary] = useState("");
  const [pasteTargetDate, setPasteTargetDate] = useState(initialRange.today);
  const [pasteTargetTime, setPasteTargetTime] = useState("");
  const handledCreateRequestIdRef = useRef<number | null>(null);
  const records = recordsQuery.data ?? [];
  const createRecordRequestId = getCreateRecordRequestId(location.state);

  const handleMutationSuccess = async (message: string) => {
    setEditorState(null);
    setEditorError("");
    setSummary(message);
    await invalidateFinanceData(queryClient);
  };

  const createMutation = useMutation({
    mutationFn: createRecord,
    onSuccess: async (record) => {
      await handleMutationSuccess(`Saved ${record.description || "record"}.`);
    },
    onError: (error) => setEditorError(getErrorMessage(error)),
  });
  const updateMutation = useMutation({
    mutationFn: ({ payload, recordId }: { payload: RecordMutationPayload; recordId: string }) =>
      updateRecord(recordId, payload),
    onSuccess: async (record) => {
      await handleMutationSuccess(`Updated ${record.description || "record"}.`);
    },
    onError: (error) => setEditorError(getErrorMessage(error)),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteRecord,
    onSuccess: async () => {
      setSummary("Deleted record.");
      await invalidateFinanceData(queryClient);
    },
    onError: (error) => setSummary(getErrorMessage(error)),
  });
  const pasteMutation = useMutation({
    mutationFn: pasteRecord,
    onSuccess: async (record) => {
      setSummary(`Pasted ${record.description || "record"} to ${record.financeDate}.`);
      await invalidateFinanceData(queryClient);
    },
    onError: (error) => setSummary(getErrorMessage(error)),
  });
  const isEditorSubmitting = createMutation.isPending || updateMutation.isPending;

  const openCreateEditor = useCallback(() => {
    setEditorError("");
    setSummary("");
    setEditorState({ mode: "create" });
  }, []);

  useEffect(() => {
    if (
      createRecordRequestId === null ||
      handledCreateRequestIdRef.current === createRecordRequestId
    ) {
      return;
    }

    handledCreateRequestIdRef.current = createRecordRequestId;
    openCreateEditor();
    void navigate(
      {
        pathname: location.pathname,
        search: location.search,
      },
      {
        replace: true,
        state: null,
      },
    );
  }, [createRecordRequestId, location.pathname, location.search, navigate, openCreateEditor]);

  const openEditEditor = (record: FinanceRecord) => {
    setEditorError("");
    setSummary("");
    setEditorState({ mode: "edit", record });
  };

  const handleEditorSubmit = (payload: RecordMutationPayload) => {
    if (!editorState || editorState.mode === "create") {
      createMutation.mutate(payload);
      return;
    }

    updateMutation.mutate({
      payload,
      recordId: editorState.record.id,
    });
  };

  const handleCopyRecord = (record: FinanceRecord) => {
    copyRecord(record);
    setSummary(`Copied ${record.description || "record"}.`);
  };

  const handlePasteRecord = () => {
    if (!copiedRecord) {
      return;
    }

    pasteMutation.mutate({
      sourceRecordId: copiedRecord.sourceRecordId,
      sourceSnapshot: copiedRecord.sourceSnapshot,
      targetDate: pasteTargetDate,
      ...(pasteTargetTime ? { targetTime: pasteTargetTime } : {}),
    });
  };

  return (
    <section className="grid gap-5" aria-labelledby="records-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Finance records</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-normal" id="records-heading">
            Records
          </h2>
        </div>
        <Button onClick={openCreateEditor} type="button">
          <Plus aria-hidden="true" />
          Create record
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px_120px_auto] sm:items-end">
          <p className="text-sm text-muted-foreground">
            {copiedRecord
              ? `Ready to paste ${copiedRecord.sourceSnapshot.description || "record"}.`
              : "Copy a record to paste its snapshot onto another date."}
          </p>
          <label className="grid gap-1 text-sm font-medium">
            Paste target date
            <Input
              disabled={pasteMutation.isPending}
              onChange={(event) => setPasteTargetDate(event.target.value)}
              type="date"
              value={pasteTargetDate}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Paste time
            <Input
              disabled={pasteMutation.isPending}
              onChange={(event) => setPasteTargetTime(event.target.value)}
              type="time"
              value={pasteTargetTime}
            />
          </label>
          <Button
            disabled={!copiedRecord || pasteMutation.isPending || !pasteTargetDate}
            onClick={handlePasteRecord}
            type="button"
            variant="secondary"
          >
            <ClipboardPaste aria-hidden="true" />
            Paste record
          </Button>
        </div>
        {summary ? (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {summary}
          </p>
        ) : null}
      </div>

      {editorState ? (
        <RecordEditor
          defaultDate={initialRange.today}
          isSubmitting={isEditorSubmitting}
          onCancel={() => setEditorState(null)}
          onSubmit={handleEditorSubmit}
          record={editorState.mode === "edit" ? editorState.record : undefined}
          serverError={editorError}
          {...(renderRecurringValueControls ? { renderRecurringValueControls } : {})}
        />
      ) : null}

      {recordsQuery.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(recordsQuery.error)}
        </p>
      ) : null}

      {recordsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading records</p>
      ) : null}

      {!recordsQuery.isPending && records.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          No records for this month yet.
        </div>
      ) : null}

      <div className="grid gap-3">
        {records.map((record) => (
          <RecordCard
            actions={
              <>
                <Button
                  aria-label={`Edit ${record.description || "record"} record`}
                  onClick={() => openEditEditor(record)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Edit3 aria-hidden="true" />
                  Edit
                </Button>
                <Button
                  aria-label={`Copy ${record.description || "record"} record`}
                  onClick={() => handleCopyRecord(record)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <ClipboardCopy aria-hidden="true" />
                  Copy
                </Button>
                <Button
                  aria-label={`Delete ${record.description || "record"} record`}
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(record.id)}
                  size="sm"
                  type="button"
                  variant="destructive"
                >
                  <Trash2 aria-hidden="true" />
                  Delete
                </Button>
              </>
            }
            key={record.id}
            record={record}
          />
        ))}
      </div>
    </section>
  );
}
