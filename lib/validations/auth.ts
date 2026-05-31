import { z } from "zod";

export const authRoles = ["ADMIN", "OWNER", "RENTER"] as const;

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name."),
  email: z.email("Please enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  role: z.enum(authRoles),
});

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(1, "Please enter your password."),
});

export const loginVerificationSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Please enter the 6-digit code sent to your email."),
});

export const forgotPasswordRequestSchema = z.object({
  email: z.email("Please enter a valid email address.").trim().toLowerCase(),
});

export const forgotPasswordTokenSchema = z.object({
  token: z.string().trim().uuid("The reset link is invalid."),
});

export const forgotPasswordResetSchema = z.object({
  token: z.string().trim().uuid("The reset link is invalid."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LoginVerificationInput = z.infer<typeof loginVerificationSchema>;
export type ForgotPasswordRequestInput = z.infer<typeof forgotPasswordRequestSchema>;
export type ForgotPasswordTokenInput = z.infer<typeof forgotPasswordTokenSchema>;
export type ForgotPasswordResetInput = z.infer<typeof forgotPasswordResetSchema>;
