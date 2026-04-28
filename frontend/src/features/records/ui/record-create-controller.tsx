import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { invalidateFinanceData } from "@entities/record";
import { getApiErrorMessage } from "@shared/api/errors";
import { formatFinanceDate } from "@shared/lib/date";
import { ModalOverlay } from "@shared/ui/modal";

import { createRecord } from "../api/record-api";
import type { RecordMutationPayload } from "../model/forms";
import { RecordEditor } from "./record-editor";

type CreateRecordLocationState = {
  createRecordRequestId?: unknown;
};

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

export function RecordCreateController() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const defaultDate = useMemo(() => formatFinanceDate(new Date()), []);
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [summary, setSummary] = useState("");
  const handledCreateRequestIdRef = useRef<number | null>(null);
  const createRecordRequestId = getCreateRecordRequestId(location.state);

  const openCreateEditor = useCallback(() => {
    setEditorError("");
    setSummary("");
    setEditorOpen(true);
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

  const createMutation = useMutation({
    mutationFn: createRecord,
    onSuccess: async (record) => {
      setEditorOpen(false);
      setEditorError("");
      setSummary(`Saved ${record.description || "record"}.`);
      await invalidateFinanceData(queryClient);
    },
    onError: (error) => setEditorError(getErrorMessage(error)),
  });

  const closeEditor = () => {
    setEditorOpen(false);
    setEditorError("");
  };

  const handleEditorSubmit = (payload: RecordMutationPayload) => {
    createMutation.mutate(payload);
  };

  return (
    <>
      {summary ? (
        <p
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-40 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-md border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg"
          role="status"
        >
          {summary}
        </p>
      ) : null}

      {isEditorOpen ? (
        <ModalOverlay onClose={closeEditor}>
          <RecordEditor
            className="w-full"
            defaultDate={defaultDate}
            isModal
            isSubmitting={createMutation.isPending}
            onCancel={closeEditor}
            onSubmit={handleEditorSubmit}
            serverError={editorError}
          />
        </ModalOverlay>
      ) : null}
    </>
  );
}
