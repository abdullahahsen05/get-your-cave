import { z } from "zod";

export const messageTypeValues = ["TEXT", "FILE", "SYSTEM"] as const;

export const conversationStartSchema = z
  .object({
    listingId: z.string().uuid().optional(),
    bookingId: z.string().uuid().optional(),
    targetUserId: z.string().uuid().optional(),
  })
  .refine((value) => value.listingId || value.bookingId || value.targetUserId, {
    message: "Please provide a listing, booking, or target user.",
  });

export const messageCreateSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty."),
  type: z.enum(messageTypeValues).default("TEXT"),
  fileUrl: z.string().trim().url().optional().or(z.literal("")),
  fileName: z.string().trim().min(1).max(255).optional().or(z.literal("")),
});

export const messageReadSchema = z.object({
  conversationId: z.string().uuid(),
});

export type ConversationStartInput = z.infer<typeof conversationStartSchema>;
export type MessageCreateInput = z.infer<typeof messageCreateSchema>;
export type MessageReadInput = z.infer<typeof messageReadSchema>;
