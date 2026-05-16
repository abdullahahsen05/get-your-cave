import { BookingStatus } from "@prisma/client";
import { z } from "zod";

const optionalBookingNote = z
  .string()
  .trim()
  .max(2000)
  .optional();

export const bookingCreateSchema = z.object({
  listingId: z.string().uuid("Please choose a listing."),
  startDate: z.string().trim().min(1, "Please choose a move-in date."),
  endDate: z.string().trim().min(1).optional(),
  durationMonths: z.coerce.number().int().positive().max(120).optional(),
  renterNote: optionalBookingNote,
});

export const bookingUpdateSchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  renterNote: optionalBookingNote,
  ownerNote: optionalBookingNote,
  startDate: z.string().trim().min(1).optional(),
  endDate: z.string().trim().min(1).optional(),
  durationMonths: z.coerce.number().int().positive().max(120).optional(),
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type BookingUpdateInput = z.infer<typeof bookingUpdateSchema>;
