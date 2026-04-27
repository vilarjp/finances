import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, RefreshCcw, Save, Tag, Unlink } from "lucide-react";
import { useState, type FormEvent } from "react";

import {
  RecurringTagSelect,
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

type RecurringTagValueEditorProps = {
  className?: string;
  disabled?: boolean;
  labelPrefix?: string;
  onValueChange: (value: RecurringTagValueEditorValue) => void;
  showAmountInput?: boolean;
  surface?: "card" | "inline";
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

export function RecurringTagValueEditor({
  className,
  disabled = false,
  labelPrefix,
  onValueChange,
  showAmountInput = true,
  surface = "card",
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
  const recurringTagLabel = labelPrefix ? `${labelPrefix} recurring tag` : "Recurring tag";
  const newTagNameLabel = labelPrefix
    ? `${labelPrefix} new recurring tag name`
    : "New recurring tag name";
  const selectedTagNameLabel = labelPrefix
    ? `${labelPrefix} selected tag name`
    : "Selected tag name";

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

  const submitCreate = () => {
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

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    submitCreate();
  };

  const submitEdit = () => {
    const parsed = recurringTagFormSchema.safeParse({
      name: selectedTagName,
    });

    if (!parsed.success) {
      setEditError(parsed.error.issues[0]?.message ?? "Check the recurring tag fields.");
      return;
    }

    updateMutation.mutate(parsed.data.name);
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    submitEdit();
  };

  const submitAmount = () => {
    const parsed = updateRecurringTagAmountFormSchema.safeParse({
      amountCents: value.amountCents,
    });

    if (!parsed.success) {
      setAmountError(parsed.error.issues[0]?.message ?? "Check the recurring tag amount.");
      return;
    }

    amountMutation.mutate(parsed.data.amountCents);
  };

  const handleAmountSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    submitAmount();
  };

  const createControls = (
    <>
      <label className="grid gap-1 text-sm font-medium">
        {newTagNameLabel}
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
      <Button
        disabled={isDisabled}
        onClick={surface === "inline" ? submitCreate : undefined}
        type={surface === "inline" ? "button" : "submit"}
      >
        <Plus aria-hidden="true" />
        Create recurring tag from value
      </Button>
    </>
  );
  const editControls = (
    <>
      <label className="grid gap-1 text-sm font-medium">
        {selectedTagNameLabel}
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
      <Button
        disabled={!selectedTag || isDisabled}
        onClick={surface === "inline" ? submitEdit : undefined}
        type={surface === "inline" ? "button" : "submit"}
        variant="secondary"
      >
        <Save aria-hidden="true" />
        Save recurring tag
      </Button>
    </>
  );
  const amountControls = (
    <>
      {amountError ? (
        <p role="alert" className="text-sm text-destructive">
          {amountError}
        </p>
      ) : null}
      <Button
        disabled={!selectedTag || isDisabled}
        onClick={surface === "inline" ? submitAmount : undefined}
        type={surface === "inline" ? "button" : "submit"}
        variant="outline"
      >
        <RefreshCcw aria-hidden="true" />
        Update shared tag amount
      </Button>
      {summary ? (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {summary}
        </p>
      ) : null}
    </>
  );

  return (
    <section
      className={cn(
        surface === "card"
          ? "rounded-lg border bg-card p-5 text-card-foreground shadow-sm"
          : "grid gap-4 rounded-md border border-dashed p-3",
        className,
      )}
    >
      <div className={cn("flex items-center gap-2", surface === "card" && "mb-5")}>
        <Tag aria-hidden="true" className="size-5 text-primary" />
        <h2 className={cn(surface === "card" ? "text-xl" : "text-base", "font-semibold")}>
          Recurring Tags
        </h2>
      </div>

      {recurringTagsQuery.isError ? (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {getErrorMessage(recurringTagsQuery.error)}
        </p>
      ) : null}

      <div className="grid gap-5">
        <div className="grid gap-3">
          {showAmountInput ? (
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
          ) : null}

          <RecurringTagSelect
            disabled={isDisabled}
            label={recurringTagLabel}
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

        {surface === "inline" ? (
          <div className="grid gap-3 border-t pt-5">{createControls}</div>
        ) : (
          <form className="grid gap-3 border-t pt-5" onSubmit={handleCreateSubmit}>
            {createControls}
          </form>
        )}

        {surface === "inline" ? (
          <div className="grid gap-3 border-t pt-5">{editControls}</div>
        ) : (
          <form className="grid gap-3 border-t pt-5" onSubmit={handleEditSubmit}>
            {editControls}
          </form>
        )}

        {surface === "inline" ? (
          <div className="grid gap-3 border-t pt-5">{amountControls}</div>
        ) : (
          <form className="grid gap-3 border-t pt-5" onSubmit={handleAmountSubmit}>
            {amountControls}
          </form>
        )}
      </div>
    </section>
  );
}
