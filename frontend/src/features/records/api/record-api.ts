import type { FinanceRecord, RecordSnapshot } from "@entities/record";
import { apiDelete, apiPatch, apiPost } from "@shared/api/http-client";

import type { RecordMutationPayload } from "../model/forms";

type RecordResponse = {
  record: FinanceRecord;
};

export type PasteRecordPayload = {
  sourceSnapshot: RecordSnapshot;
  targetDate: string;
  sourceRecordId?: string;
  targetTime?: string;
};

export async function createRecord(values: RecordMutationPayload) {
  const response = await apiPost<RecordResponse>("/records", values);

  if (!response.ok) {
    throw new Error("Record creation did not return a record.");
  }

  return response.data.record;
}

export async function updateRecord(recordId: string, values: RecordMutationPayload) {
  const response = await apiPatch<RecordResponse>(`/records/${recordId}`, values);

  if (!response.ok) {
    throw new Error("Record update did not return a record.");
  }

  return response.data.record;
}

export async function deleteRecord(recordId: string) {
  await apiDelete<void>(`/records/${recordId}`, {
    expectJson: false,
  });
}

export async function pasteRecord(values: PasteRecordPayload) {
  const response = await apiPost<RecordResponse>("/records/paste", values);

  if (!response.ok) {
    throw new Error("Record paste did not return a record.");
  }

  return response.data.record;
}
