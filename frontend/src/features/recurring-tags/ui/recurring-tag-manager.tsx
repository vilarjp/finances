import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCcw, Save, Trash2, Tags } from "lucide-react";
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
import { formatMoneyCents } from "@shared/lib/money";
import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";

import {
  createRecurringTag,
  deleteRecurringTag,
  updateRecurringTag,
  updateRecurringTagAmount,
} from "../api/recurring-tag-api";
import {
  createRecurringTagFormSchema,
  recurringTagFormSchema,
  updateRecurringTagAmountFormSchema,
  type CreateRecurringTagFormValues,
} from "../model/forms";

type RecurringTagManagerProps = {
  className?: string;
  surface?: "card" | "plain";
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

function getRecurringTagValues(recurringTag: RecurringTag): CreateRecurringTagFormValues {
  return {
    amountCents: recurringTag.amountCents,
    name: recurringTag.name,
  };
}

function getSurfaceClassName(surface: RecurringTagManagerProps["surface"]) {
  if (surface === "plain") {
    return "grid gap-5 text-card-foreground";
  }

  return "rounded-lg border bg-card p-5 text-card-foreground shadow-sm";
}

export function RecurringTagManager({ className, surface = "card" }: RecurringTagManagerProps) {
  const queryClient = useQueryClient();
  const recurringTagsQuery = useRecurringTagsQuery();
  const recurringTags = recurringTagsQuery.data ?? [];
  const [selectedRecurringTagId, setSelectedRecurringTagId] = useState("");
  const selectedTag = findRecurringTag(recurringTags, selectedRecurringTagId);
  const [createValues, setCreateValues] = useState<CreateRecurringTagFormValues>({
    amountCents: 0,
    name: "",
  });
  const [editValues, setEditValues] = useState<CreateRecurringTagFormValues>({
    amountCents: 0,
    name: "",
  });
  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [summary, setSummary] = useState("");

  const invalidateRecurringTags = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: recurringTagsQueryKey,
      }),
      invalidateFinanceData(queryClient),
    ]);
  };

  const handleSelectedRecurringTagChange = (recurringTagId: string) => {
    const nextSelectedTag = findRecurringTag(recurringTags, recurringTagId);

    setSelectedRecurringTagId(recurringTagId);
    setEditError("");
    setAmountError("");
    setSummary("");
    setEditValues(
      nextSelectedTag
        ? getRecurringTagValues(nextSelectedTag)
        : {
            amountCents: 0,
            name: "",
          },
    );
  };

  const createMutation = useMutation({
    mutationFn: createRecurringTag,
    onSuccess: async (recurringTag) => {
      setCreateValues({
        amountCents: 0,
        name: "",
      });
      setCreateError("");
      setSummary("");
      setSelectedRecurringTagId(recurringTag.id);
      setEditValues(getRecurringTagValues(recurringTag));
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
      setSelectedRecurringTagId(recurringTag.id);
      setEditValues(getRecurringTagValues(recurringTag));
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
      setSelectedRecurringTagId(recurringTag.id);
      setEditValues(getRecurringTagValues(recurringTag));
      await invalidateRecurringTags();
    },
    onError: (error) => setAmountError(getErrorMessage(error)),
  });
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!selectedTag) {
        throw new Error("Select a recurring tag before deleting.");
      }

      return deleteRecurringTag(selectedTag.id);
    },
    onSuccess: async () => {
      setSelectedRecurringTagId("");
      setEditValues({
        amountCents: 0,
        name: "",
      });
      setEditError("");
      setAmountError("");
      setSummary("Deleted recurring tag.");
      await invalidateRecurringTags();
    },
    onError: (error) => setEditError(getErrorMessage(error)),
  });

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    amountMutation.isPending ||
    deleteMutation.isPending;

  const updateCreateAmount = (amountInput: string) => {
    const amountCents = amountInput === "" ? 0 : Number(amountInput);

    if (Number.isNaN(amountCents)) {
      return;
    }

    setCreateValues({ ...createValues, amountCents });
  };

  const updateEditAmount = (amountInput: string) => {
    const amountCents = amountInput === "" ? 0 : Number(amountInput);

    if (Number.isNaN(amountCents)) {
      return;
    }

    setAmountError("");
    setSummary("");
    setEditValues({ ...editValues, amountCents });
  };

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = createRecurringTagFormSchema.safeParse(createValues);

    if (!parsed.success) {
      setCreateError(parsed.error.issues[0]?.message ?? "Check the recurring tag fields.");
      return;
    }

    createMutation.mutate(parsed.data);
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = recurringTagFormSchema.safeParse({
      name: editValues.name,
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
      amountCents: editValues.amountCents,
    });

    if (!parsed.success) {
      setAmountError(parsed.error.issues[0]?.message ?? "Check the recurring tag amount.");
      return;
    }

    amountMutation.mutate(parsed.data.amountCents);
  };

  return (
    <section className={cn(getSurfaceClassName(surface), className)}>
      <div className={cn("flex items-center gap-2", surface === "card" && "mb-5")}>
        <Tags aria-hidden="true" className="size-5 text-primary" />
        <h2 className="text-xl font-semibold">Recurring tags</h2>
      </div>

      {recurringTagsQuery.isError ? (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {getErrorMessage(recurringTagsQuery.error)}
        </p>
      ) : null}

      <div className="grid gap-5">
        <RecurringTagSelect
          disabled={isMutating}
          onValueChange={handleSelectedRecurringTagChange}
          value={selectedRecurringTagId}
        />

        <form className="grid gap-3" onSubmit={handleCreateSubmit}>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
            <label className="grid gap-1 text-sm font-medium">
              New recurring tag name
              <Input
                disabled={isMutating}
                onChange={(event) => setCreateValues({ ...createValues, name: event.target.value })}
                value={createValues.name}
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              New recurring tag amount cents
              <Input
                disabled={isMutating}
                min={1}
                onChange={(event) => updateCreateAmount(event.target.value)}
                step={1}
                type="number"
                value={createValues.amountCents === 0 ? "" : createValues.amountCents}
              />
            </label>
          </div>
          {createError ? (
            <p role="alert" className="text-sm text-destructive">
              {createError}
            </p>
          ) : null}
          <Button disabled={isMutating} type="submit">
            <Plus aria-hidden="true" />
            Create recurring tag
          </Button>
        </form>

        <form className="grid gap-3 border-t pt-5" onSubmit={handleEditSubmit}>
          <label className="grid gap-1 text-sm font-medium">
            Recurring tag name
            <Input
              disabled={!selectedTag || isMutating}
              onChange={(event) => setEditValues({ ...editValues, name: event.target.value })}
              value={editValues.name}
            />
          </label>
          {editError ? (
            <p role="alert" className="text-sm text-destructive">
              {editError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button disabled={!selectedTag || isMutating} type="submit">
              <Save aria-hidden="true" />
              Save recurring tag
            </Button>
            <Button
              disabled={!selectedTag || isMutating}
              onClick={() => deleteMutation.mutate()}
              type="button"
              variant="destructive"
            >
              <Trash2 aria-hidden="true" />
              Delete recurring tag
            </Button>
          </div>
        </form>

        <form className="grid gap-3 border-t pt-5" onSubmit={handleAmountSubmit}>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-end">
            <div className="grid gap-2">
              <label className="grid gap-1 text-sm font-medium">
                Shared amount cents
                <Input
                  disabled={!selectedTag || isMutating}
                  min={1}
                  onChange={(event) => updateEditAmount(event.target.value)}
                  step={1}
                  type="number"
                  value={editValues.amountCents === 0 ? "" : editValues.amountCents}
                />
              </label>
              {selectedTag ? (
                <p className="text-sm text-muted-foreground">
                  Current shared amount {formatMoneyCents(selectedTag.amountCents)}
                </p>
              ) : null}
            </div>
            <Button disabled={!selectedTag || isMutating} type="submit" variant="outline">
              <RefreshCcw aria-hidden="true" />
              Update shared amount
            </Button>
          </div>
          {amountError ? (
            <p role="alert" className="text-sm text-destructive">
              {amountError}
            </p>
          ) : null}
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
