import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password.").max(128, "Use 128 characters or fewer."),
});

export const signUpFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  name: z.string().trim().min(1, "Enter your name.").max(80, "Use 80 characters or fewer."),
  password: z
    .string()
    .min(12, "Use at least 12 characters.")
    .max(128, "Use 128 characters or fewer."),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type SignUpFormValues = z.infer<typeof signUpFormSchema>;
