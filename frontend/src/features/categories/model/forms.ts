import { z } from "zod";

const colorValueSchema = z.string().regex(/^#[\da-f]{6}$/iu, "Use a #RRGGBB color.");

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a category name.").max(80, "Use 80 characters or fewer."),
  fontColor: colorValueSchema,
  backgroundColor: colorValueSchema,
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const defaultCategoryFormValues: CategoryFormValues = {
  name: "",
  fontColor: "#111827",
  backgroundColor: "#FEF3C7",
};
