import {
  AccountStatus,
  AdminEntityType,
  DocumentType,
  ListingStatus,
  UserRole,
  VerificationStatus,
} from "@prisma/client";
import { z } from "zod";

export const adminPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const adminRangeSchema = z.enum(["7d", "30d", "90d", "12m"]);

export const adminActivityQuerySchema = adminPaginationSchema.extend({
  entityType: z.nativeEnum(AdminEntityType).optional(),
  search: z.string().trim().max(120).optional(),
});

export const adminUsersQuerySchema = adminPaginationSchema.extend({
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(AccountStatus).optional(),
  search: z.string().trim().max(120).optional(),
});

export const adminListingsQuerySchema = adminPaginationSchema.extend({
  status: z.nativeEnum(ListingStatus).optional(),
  search: z.string().trim().max(120).optional(),
});

export const adminVerificationsQuerySchema = adminPaginationSchema.extend({
  status: z.nativeEnum(VerificationStatus).optional(),
  type: z.nativeEnum(DocumentType).optional(),
  search: z.string().trim().max(120).optional(),
});

export const adminRejectReasonSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const adminListingModerationSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const adminVerificationModerationSchema = z.object({
  rejectionReason: z.string().trim().max(500).optional(),
  reason: z.string().trim().max(500).optional(),
});
