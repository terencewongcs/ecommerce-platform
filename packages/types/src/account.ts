import { z } from "zod";

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

// Backend uses this — token comes from the URL, not the form.
export const ConfirmPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type ConfirmPasswordInput = z.infer<typeof ConfirmPasswordSchema>;

// Frontend-only: includes confirmPassword field with match validation.
export const ResetPasswordFormSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormInput = z.infer<typeof ResetPasswordFormSchema>;
