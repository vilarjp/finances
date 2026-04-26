import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, RefreshCcw, Save, Tag, Unlink } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import {
  recurringTagsQueryKey,
  useRecurringTagsQuery,
  type RecurringTag,
  type RecurringTagPropagation,
} from "@entities/recurring-tag";
import { invalidateFinanceData } from "@entities/record";
import { getApiErrorMessage } from "@shared/api/errors";
import { cn } from "@shared/lib/utils";
import { formatMoneyCents } from "@shared/lib/money";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";

import {
  createRecurringTag,
  updateRecurringTag,
  updateRecurringTagAmount,
} from "../api/recurring-tag-api";
import {
  createRecurringTagFormSchema,
  recurringTagFormSchema,
  updateRecurringTagAmountFormSchema,
} from "../model/forms";

export type RecurringTagValueEditorValue = {
  amountCents: number;
  recurringValueTagId: string;
};

type RecurringTagSelectProps = {
  className?: string;
  disabled?: boolean;
  label?: string;
  onValueChange: (recurringTagId: string) => void;
  value: string;
};

type RecurringTagValueEditorProps = {
  className?: string;
  disabled?: boolean;
  onValueChange: (value: RecurringTagValueEditorValue) => void;
  value: RecurringTagValueEditorValue;
};

function getErrorMessage(error: unknown) {
  return getApiErrorMessage(error, "Recurring tag request failed.");
}

function findRecurringTag(recurringTags: RecurringTag[], recurringTagId: string) {
  return recurringTags.find((recurringTag) => recurringTag.id === recurringTagId) ?? null;
}

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

function formatPropagationSummary(propagation: RecurringTagPropagation) {
  const valueLabel = pluralize(propagation.affectedValueCount, "value", "values");
  const recordLabel = pluralize(propagation.affectedRecordCount, "record", "records");

  return `Updated ${propagation.affectedValueCount} ${valueLabel} in ${propagation.affectedRecordCount} ${recordLabel}.`;
}

export function RecurringTagSelect({
  className,
  disabled = false,
  label = "Recurring tag",
  onValueChange,
  value,
}: RecurringTagSelectProps) {
  const selectId = useId();
  const recurringTagsQuery = useRecurringTagsQuery();
  const recurringTags = recurringTagsQuery.data ?? [];

  return (
    <label className={cn("grid gap-1 text-sm font-medium", className)} htmlFor={selectId}>
      {label}
      <select
        className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-base outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        disabled={disabled || recurringTagsQuery.isPending}
        id={selectId}
        onChange={(event) => onValueChange(event.target.value)}
        value={value}
      >
        <option value="">No recurring tag</option>
        {recurringTags.map((recurringTag) => (
          <option key={recurringTag.id} value={recurringTag.id}>
            {recurringTag.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function RecurringTagValueEditor({
  className,
  disabled = false,
  onValueChange,
  value,
}: RecurringTagValueEditorProps) {
  const queryClient = useQueryClient();
  const recurringTagsQuery = useRecurringTagsQuery();
  const recurringTags = recurringTagsQuery.data ?? [];
  const selectedTag = findRecurringTag(recurringTags, value.recurringValueTagId);
  const [createName, setCreateName] = useState("");
  const [selectedTagDraft, setSelectedTagDraft] = useState({
    name: "",
    recurringTagId: "",
  });
  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [summary, setSummary] = useState("");
  const selectedTagName =
    selectedTag && selectedTagDraft.recurringTagId === selectedTag.id
      ? selectedTagDraft.name
      : (selectedTag?.name ?? "");

  const invalidateRecurringTags = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: recurringTagsQueryKey,
      }),
      invalidateFinanceData(queryClient),
    ]);
  };

  const updateValue = (nextValue: RecurringTagValueEditorValue) => {
    onValueChange(nextValue);
  };

  const createMutation = useMutation({
    mutationFn: createRecurringTag,
    onSuccess: async (recurringTag) => {
      setCreateName("");
      setCreateError("");
      setSelectedTagDraft({
        name: recurringTag.name,
        recurringTagId: recurringTag.id,
      });
      setSummary("");
      updateValue({
        ...value,
        recurringValueTagId: recurringTag.id,
      });
      await invalidateRecurringTags();
    },
    onError: (error) => setCreateError(getErrorMessage(error)),
  });
  const updateMutation = useMutation({
    mutationFn: (name: string) => {
      if (!selectedTag) {
        throw new Error("Select a recurring tag before saving.");
      }

      return updateRecurringTag(selectedTag.id, { name });
    },
    onSuccess: async (recurringTag) => {
      setEditError("");
      setSelectedTagDraft({
        name: recurringTag.name,
        recurringTagId: recurringTag.id,
      });
      await invalidateRecurringTags();
    },
    onError: (error) => setEditError(getErrorMessage(error)),
  });
  const amountMutation = useMutation({
    mutationFn: (amountCents: number) => {
      if (!selectedTag) {
        throw new Error("Select a recurring tag before updating its amount.");
      }

      return updateRecurringTagAmount(selectedTag.id, { amountCents });
    },
    onSuccess: async ({ propagation, recurringTag }) => {
      setAmountError("");
      setSummary(formatPropagationSummary(propagation));
      updateValue({
        ...value,
        recurringValueTagId: recurringTag.id,
      });
      await invalidateRecurringTags();
    },
    onError: (error) => setAmountError(getErrorMessage(error)),
  });

  const isMutating =
    createMutation.isPending || updateMutation.isPending || amountMutation.isPending;
  const isDisabled = disabled || isMutating;

  const handleAmountChange = (amountInput: string) => {
    const amountCents = amountInput === "" ? 0 : Number(amountInput);

    if (Number.isNaN(amountCents)) {
      return;
    }

    setAmountError("");
    setSummary("");
    updateValue({
      ...value,
      amountCents,
    });
  };

  const handleSelectedTagChange = (recurringTagId: string) => {
    const nextSelectedTag = findRecurringTag(recurringTags, recurringTagId);

    setEditError("");
    setAmountError("");
    setSelectedTagDraft({
      name: nextSelectedTag?.name ?? "",
      recurringTagId,
    });
    setSummary("");
    updateValue({
      ...value,
      recurringValueTagId: recurringTagId,
    });
  };

  const handleApplyStoredAmount = () => {
    if (!selectedTag) {
      return;
    }

    setAmountError("");
    setSummary("");
    updateValue({
      amountCents: selectedTag.amountCents,
      recurringValueTagId: selectedTag.id,
    });
  };

  const handleUnlink = () => {
    setEditError("");
    setAmountError("");
    setSelectedTagDraft({
      name: "",
      recurringTagId: "",
    });
    setSummary("");
    updateValue({
      ...value,
      recurringValueTagId: "",
    });
  };

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = createRecurringTagFormSchema.safeParse({
      amountCents: value.amountCents,
      name: createName,
    });

    if (!parsed.success) {
      setCreateError(parsed.error.issues[0]?.message ?? "Check the recurring tag fields.");
      return;
    }

    createMutation.mutate(parsed.data);
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = recurringTagFormSchema.safeParse({
      name: selectedTagName,
    });

    if (!parsed.success) {
      setEditError(parsed.error.issues[0]?.message ?? "Check the recurring tag fields.");
      return;
    }

    updateMutation.mutate(parsed.data.name);
  };

  const handleAmountSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = updateRecurringTagAmountFormSchema.safeParse({
      amountCents: value.amountCents,
    });

    if (!parsed.success) {
      setAmountError(parsed.error.issues[0]?.message ?? "Check the recurring tag amount.");
      return;
    }

    amountMutation.mutate(parsed.data.amountCents);
  };

  return (
    <section
      className={cn("rounded-lg border bg-card p-5 text-card-foreground shadow-sm", className)}
    >
      <div className="mb-5 flex items-center gap-2">
        <Tag aria-hidden="true" className="size-5 text-primary" />
        <h2 className="text-xl font-semibold">Recurring Tags</h2>
      </div>

      {recurringTagsQuery.isError ? (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {getErrorMessage(recurringTagsQuery.error)}
        </p>
      ) : null}

      <div className="grid gap-5">
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm font-medium">
            Value amount cents
            <Input
              disabled={isDisabled}
              min={1}
              onChange={(event) => handleAmountChange(event.target.value)}
              step={1}
              type="number"
              value={value.amountCents === 0 ? "" : value.amountCents}
            />
          </label>

          <RecurringTagSelect
            disabled={isDisabled}
            onValueChange={handleSelectedTagChange}
            value={value.recurringValueTagId}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!selectedTag || isDisabled}
              onClick={handleApplyStoredAmount}
              type="button"
              variant="secondary"
            >
              <Check aria-hidden="true" />
              Apply stored amount
            </Button>
            <Button
              disabled={!selectedTag || isDisabled}
              onClick={handleUnlink}
              type="button"
              variant="outline"
            >
              <Unlink aria-hidden="true" />
              Unlink recurring tag
            </Button>
          </div>

          {selectedTag ? (
            <p className="text-sm text-muted-foreground">
              Stored amount {formatMoneyCents(selectedTag.amountCents)}
            </p>
          ) : null}
        </div>

        <form className="grid gap-3 border-t pt-5" onSubmit={handleCreateSubmit}>
          <label className="grid gap-1 text-sm font-medium">
            New recurring tag name
            <Input
              disabled={isDisabled}
              onChange={(event) => setCreateName(event.target.value)}
              value={createName}
            />
          </label>
          {createError ? (
            <p role="alert" className="text-sm text-destructive">
              {createError}
            </p>
          ) : null}
          <Button disabled={isDisabled} type="submit">
            <Plus aria-hidden="true" />
            Create recurring tag from value
          </Button>
        </form>

        <form className="grid gap-3 border-t pt-5" onSubmit={handleEditSubmit}>
          <label className="grid gap-1 text-sm font-medium">
            Selected tag name
            <Input
              disabled={!selectedTag || isDisabled}
              onChange={(event) =>
                setSelectedTagDraft({
                  name: event.target.value,
                  recurringTagId: selectedTag?.id ?? "",
                })
              }
              value={selectedTagName}
            />
          </label>
          {editError ? (
            <p role="alert" className="text-sm text-destructive">
              {editError}
            </p>
          ) : null}
          <Button disabled={!selectedTag || isDisabled} type="submit" variant="secondary">
            <Save aria-hidden="true" />
            Save recurring tag
          </Button>
        </form>

        <form className="grid gap-3 border-t pt-5" onSubmit={handleAmountSubmit}>
          {amountError ? (
            <p role="alert" className="text-sm text-destructive">
              {amountError}
            </p>
          ) : null}
          <Button disabled={!selectedTag || isDisabled} type="submit" variant="outline">
            <RefreshCcw aria-hidden="true" />
            Update shared tag amount
          </Button>
          {summary ? (
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {summary}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
