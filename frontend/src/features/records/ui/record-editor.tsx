import { Plus, Save, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import type { FinanceRecord } from "@entities/record";
import { CategorySelect } from "@features/categories";
import { RecurringTagSelect } from "@features/recurring-tags";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";

import {
  createDefaultRecordFormValues,
  createDefaultRecordValue,
  formValuesToMutationPayload,
  recordFormSchema,
  recordToFormValues,
  type RecordClassification,
  type RecordFormValues,
  type RecordMutationPayload,
  type RecordValueFormValues,
} from "../model/forms";

type RecordEditorProps = {
  defaultDate: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (payload: RecordMutationPayload) => void;
  record?: FinanceRecord;
  serverError?: string;
};

function getInitialValues(record: FinanceRecord | undefined, defaultDate: string) {
  return record ? recordToFormValues(record) : createDefaultRecordFormValues(defaultDate);
}

function ClassificationControls({
  disabled,
  onChange,
  value,
}: {
  disabled?: boolean;
  onChange: (classification: RecordClassification) => void;
  value: RecordClassification;
}) {
  const options: Array<{ label: string; value: RecordClassification }> = [
    { label: "Income", value: "income" },
    { label: "Fixed expense", value: "fixed-expense" },
    { label: "Daily expense", value: "daily-expense" },
  ];

  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">Classification</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <label
            className="flex min-h-10 items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm"
            key={option.value}
          >
            <input
              checked={value === option.value}
              disabled={disabled}
              name="record-classification"
              onChange={() => onChange(option.value)}
              type="radio"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function RecordColorInputs({
  disabled,
  onChange,
  values,
}: {
  disabled?: boolean;
  onChange: (values: RecordFormValues) => void;
  values: RecordFormValues;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-medium">
        Record font color
        <Input
          aria-label="Record font color"
          disabled={disabled}
          onChange={(event) => onChange({ ...values, fontColor: event.target.value })}
          type="color"
          value={values.fontColor}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Record background color
        <Input
          aria-label="Record background color"
          disabled={disabled}
          onChange={(event) => onChange({ ...values, backgroundColor: event.target.value })}
          type="color"
          value={values.backgroundColor}
        />
      </label>
    </div>
  );
}

function RecordValueFields({
  disabled,
  index,
  onChange,
  onRemove,
  value,
  canRemove,
}: {
  canRemove: boolean;
  disabled?: boolean;
  index: number;
  onChange: (value: RecordValueFormValues) => void;
  onRemove: () => void;
  value: RecordValueFormValues;
}) {
  const valueNumber = index + 1;

  return (
    <fieldset className="grid gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <legend className="text-sm font-semibold">Value {valueNumber}</legend>
        <Button
          aria-label={`Remove value ${valueNumber}`}
          disabled={!canRemove || disabled}
          onClick={onRemove}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Trash2 aria-hidden="true" />
          Remove
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Value {valueNumber} label
          <Input
            disabled={disabled}
            onChange={(event) => onChange({ ...value, label: event.target.value })}
            value={value.label}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Value {valueNumber} amount cents
          <Input
            disabled={disabled}
            min={1}
            onChange={(event) => {
              const amountCents = event.target.value === "" ? 0 : Number(event.target.value);

              if (!Number.isNaN(amountCents)) {
                onChange({ ...value, amountCents });
              }
            }}
            step={1}
            type="number"
            value={value.amountCents === 0 ? "" : value.amountCents}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CategorySelect
          disabled={disabled}
          label={`Value ${valueNumber} category`}
          onValueChange={(categoryId) => onChange({ ...value, categoryId })}
          value={value.categoryId}
        />
        <RecurringTagSelect
          disabled={disabled}
          label={`Value ${valueNumber} recurring tag`}
          onValueChange={(recurringValueTagId) => onChange({ ...value, recurringValueTagId })}
          value={value.recurringValueTagId}
        />
      </div>
    </fieldset>
  );
}

export function RecordEditor({
  defaultDate,
  isSubmitting = false,
  onCancel,
  onSubmit,
  record,
  serverError,
}: RecordEditorProps) {
  const [values, setValues] = useState<RecordFormValues>(() =>
    getInitialValues(record, defaultDate),
  );
  const [validationError, setValidationError] = useState("");
  const title = record ? "Edit record" : "Create record";
  const isDisabled = isSubmitting;

  const updateValue = (index: number, nextValue: RecordValueFormValues) => {
    setValues({
      ...values,
      values: values.values.map((value, valueIndex) => {
        if (valueIndex === index) {
          return nextValue;
        }

        return value;
      }),
    });
  };

  const removeValue = (index: number) => {
    setValues({
      ...values,
      values: values.values.filter((_value, valueIndex) => valueIndex !== index),
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = recordFormSchema.safeParse(values);

    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Check the record fields.");
      return;
    }

    setValidationError("");
    onSubmit(formValuesToMutationPayload(parsed.data));
  };

  return (
    <section
      aria-labelledby="record-editor-title"
      aria-modal="false"
      className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm"
      role="dialog"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Record editor</p>
          <h2 className="mt-1 text-2xl font-semibold" id="record-editor-title">
            {title}
          </h2>
        </div>
        <Button
          aria-label="Close record editor"
          onClick={onCancel}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X aria-hidden="true" />
        </Button>
      </div>

      <form className="grid gap-5" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
          <label className="grid gap-1 text-sm font-medium">
            Record description
            <Input
              disabled={isDisabled}
              maxLength={500}
              onChange={(event) => setValues({ ...values, description: event.target.value })}
              value={values.description}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Effective date
            <Input
              disabled={isDisabled}
              onChange={(event) => setValues({ ...values, effectiveDate: event.target.value })}
              type="date"
              value={values.effectiveDate}
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm font-medium sm:max-w-40">
          Effective time
          <Input
            disabled={isDisabled}
            onChange={(event) => setValues({ ...values, effectiveTime: event.target.value })}
            type="time"
            value={values.effectiveTime}
          />
        </label>

        <ClassificationControls
          disabled={isDisabled}
          onChange={(classification) => setValues({ ...values, classification })}
          value={values.classification}
        />

        <RecordColorInputs disabled={isDisabled} onChange={setValues} values={values} />

        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold">Values</h3>
            <Button
              disabled={isDisabled || values.values.length >= 50}
              onClick={() =>
                setValues({
                  ...values,
                  values: [...values.values, createDefaultRecordValue()],
                })
              }
              type="button"
              variant="secondary"
            >
              <Plus aria-hidden="true" />
              Add value
            </Button>
          </div>

          {values.values.map((value, index) => (
            <RecordValueFields
              canRemove={values.values.length > 1}
              disabled={isDisabled}
              index={index}
              key={index}
              onChange={(nextValue) => updateValue(index, nextValue)}
              onRemove={() => removeValue(index)}
              value={value}
            />
          ))}
        </div>

        {validationError || serverError ? (
          <p role="alert" className="text-sm text-destructive">
            {validationError || serverError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button disabled={isDisabled} type="submit">
            <Save aria-hidden="true" />
            Save record
          </Button>
          <Button disabled={isDisabled} onClick={onCancel} type="button" variant="outline">
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}
