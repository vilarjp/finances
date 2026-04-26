export type RecurringTag = {
  id: string;
  name: string;
  amountCents: number;
  lastAmountUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type RecurringTagPropagation = {
  affectedRecordCount: number;
  affectedValueCount: number;
  cutoffAt: string;
  skippedPastValueCount: number;
};
