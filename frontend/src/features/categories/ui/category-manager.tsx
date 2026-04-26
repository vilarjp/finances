import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Palette, Plus, Save, Trash2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { categoriesQueryKey, useCategoriesQuery } from "@entities/category";
import type { Category } from "@entities/category";
import { invalidateFinanceData } from "@entities/record";
import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";

import { createCategory, deleteCategory, updateCategory } from "../api/category-api";
import {
  categoryFormSchema,
  defaultCategoryFormValues,
  type CategoryFormValues,
} from "../model/forms";

type CategorySelectProps = {
  className?: string;
  disabled?: boolean;
  label?: string;
  onValueChange: (categoryId: string) => void;
  value: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Category request failed.";
}

function parseFormValues(values: CategoryFormValues) {
  return categoryFormSchema.safeParse(values);
}

function isHexColor(value: string) {
  return /^#[\da-f]{6}$/iu.test(value);
}

function getEditableCategoryValues(category: Category): CategoryFormValues {
  return {
    name: category.name,
    fontColor: isHexColor(category.fontColor) ? category.fontColor : "#111827",
    backgroundColor: isHexColor(category.backgroundColor) ? category.backgroundColor : "#FEF3C7",
  };
}

function CategoryColorInputs({
  disabled,
  onChange,
  values,
}: {
  disabled?: boolean;
  onChange: (values: CategoryFormValues) => void;
  values: CategoryFormValues;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-medium">
        Font color
        <Input
          aria-label="Font color"
          disabled={disabled}
          onChange={(event) => onChange({ ...values, fontColor: event.target.value })}
          type="color"
          value={values.fontColor}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Background color
        <Input
          aria-label="Background color"
          disabled={disabled}
          onChange={(event) => onChange({ ...values, backgroundColor: event.target.value })}
          type="color"
          value={values.backgroundColor}
        />
      </label>
    </div>
  );
}

export function CategorySelect({
  className,
  disabled = false,
  label = "Category",
  onValueChange,
  value,
}: CategorySelectProps) {
  const selectId = useId();
  const categoriesQuery = useCategoriesQuery();
  const categories = categoriesQuery.data ?? [];

  return (
    <label className={cn("grid gap-1 text-sm font-medium", className)} htmlFor={selectId}>
      {label}
      <select
        className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-base outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        disabled={disabled || categoriesQuery.isPending}
        id={selectId}
        onChange={(event) => onValueChange(event.target.value)}
        value={value}
      >
        <option value="">Uncategorized</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </label>
  );
}

type CategoryManagerProps = {
  onSelectedCategoryChange?: (categoryId: string) => void;
  selectedCategoryId?: string;
};

export function CategoryManager({
  onSelectedCategoryChange,
  selectedCategoryId,
}: CategoryManagerProps) {
  const queryClient = useQueryClient();
  const categoriesQuery = useCategoriesQuery();
  const [internalSelectedCategoryId, setInternalSelectedCategoryId] = useState("");
  const currentCategoryId = selectedCategoryId ?? internalSelectedCategoryId;
  const categories = categoriesQuery.data ?? [];
  const selectedCategory = categories.find((category) => category.id === currentCategoryId) ?? null;
  const [createValues, setCreateValues] = useState<CategoryFormValues>(defaultCategoryFormValues);
  const [editValues, setEditValues] = useState<CategoryFormValues>(defaultCategoryFormValues);
  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");

  const invalidateCategories = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKey,
      }),
      invalidateFinanceData(queryClient),
    ]);
  };

  const setSelectedCategory = (categoryId: string) => {
    setInternalSelectedCategoryId(categoryId);
    onSelectedCategoryChange?.(categoryId);
  };

  const handleSelectedCategoryChange = (categoryId: string) => {
    const category = categories.find((item) => item.id === categoryId);

    setSelectedCategory(categoryId);
    setEditError("");
    setEditValues(category ? getEditableCategoryValues(category) : defaultCategoryFormValues);
  };

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: async (category) => {
      setCreateValues(defaultCategoryFormValues);
      setCreateError("");
      setEditValues(getEditableCategoryValues(category));
      setSelectedCategory(category.id);
      await invalidateCategories();
    },
    onError: (error) => setCreateError(getErrorMessage(error)),
  });
  const updateMutation = useMutation({
    mutationFn: (values: CategoryFormValues) => {
      if (!selectedCategory) {
        throw new Error("Select a category before saving.");
      }

      return updateCategory(selectedCategory.id, values);
    },
    onSuccess: async (category) => {
      setEditError("");
      setEditValues(getEditableCategoryValues(category));
      setSelectedCategory(category.id);
      await invalidateCategories();
    },
    onError: (error) => setEditError(getErrorMessage(error)),
  });
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!selectedCategory) {
        throw new Error("Select a category before deleting.");
      }

      return deleteCategory(selectedCategory.id);
    },
    onSuccess: async () => {
      setEditError("");
      setEditValues(defaultCategoryFormValues);
      setSelectedCategory("");
      await invalidateCategories();
    },
    onError: (error) => setEditError(getErrorMessage(error)),
  });

  const isMutating =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = parseFormValues(createValues);

    if (!parsed.success) {
      setCreateError(parsed.error.issues[0]?.message ?? "Check the category fields.");
      return;
    }

    createMutation.mutate(parsed.data);
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = parseFormValues(editValues);

    if (!parsed.success) {
      setEditError(parsed.error.issues[0]?.message ?? "Check the category fields.");
      return;
    }

    updateMutation.mutate(parsed.data);
  };

  return (
    <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Palette aria-hidden="true" className="size-5 text-primary" />
        <h2 className="text-xl font-semibold">Categories</h2>
      </div>

      {categoriesQuery.isError ? (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {getErrorMessage(categoriesQuery.error)}
        </p>
      ) : null}

      <div className="grid gap-5">
        <CategorySelect
          disabled={isMutating}
          onValueChange={handleSelectedCategoryChange}
          value={currentCategoryId}
        />

        <form className="grid gap-3" onSubmit={handleCreateSubmit}>
          <label className="grid gap-1 text-sm font-medium">
            New category name
            <Input
              disabled={isMutating}
              onChange={(event) => setCreateValues({ ...createValues, name: event.target.value })}
              value={createValues.name}
            />
          </label>
          <CategoryColorInputs
            disabled={isMutating}
            onChange={setCreateValues}
            values={createValues}
          />
          {createError ? (
            <p role="alert" className="text-sm text-destructive">
              {createError}
            </p>
          ) : null}
          <Button disabled={isMutating} type="submit">
            <Plus aria-hidden="true" />
            Create category
          </Button>
        </form>

        <form className="grid gap-3 border-t pt-5" onSubmit={handleEditSubmit}>
          <label className="grid gap-1 text-sm font-medium">
            Category name
            <Input
              disabled={!selectedCategory || isMutating}
              onChange={(event) => setEditValues({ ...editValues, name: event.target.value })}
              value={editValues.name}
            />
          </label>
          <CategoryColorInputs
            disabled={!selectedCategory || isMutating}
            onChange={setEditValues}
            values={editValues}
          />
          {editError ? (
            <p role="alert" className="text-sm text-destructive">
              {editError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button disabled={!selectedCategory || isMutating} type="submit">
              <Save aria-hidden="true" />
              Save category
            </Button>
            <Button
              disabled={!selectedCategory || isMutating}
              onClick={() => deleteMutation.mutate()}
              type="button"
              variant="destructive"
            >
              <Trash2 aria-hidden="true" />
              Delete category
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
