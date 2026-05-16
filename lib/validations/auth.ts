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

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

