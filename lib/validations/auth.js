import { z } from "zod";

export const registrationSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  email: z.string().trim().email("Enter a valid email address.").max(255),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128).regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Password must include a letter and a number."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: z.string().min(8, "Password must be at least 8 characters.").max(128).regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Password must include a letter and a number."),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

export const forgotPasswordSchema = z.object({ email: z.string().trim().email("Enter a valid email address.").max(255) });

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  newPassword: z.string().min(8, "Password must be at least 8 characters.").max(128).regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Password must include a letter and a number."),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });
