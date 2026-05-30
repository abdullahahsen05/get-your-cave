import fs from "node:fs/promises";
import path from "node:path";

import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { ContractStatus, ContractType, Prisma, type UserRole } from "@prisma/client";

import { createNotificationForUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import {
  buildContractPlaceholderData,
  type ContractPlaceholderData,
} from "@/lib/contracts/placeholderMapper";
import {
  ensureContractDirectories,
  getDefaultTemplatePath,
  readTemplateFile,
  resolveSafeDocsPath,
} from "@/lib/contracts/loadTemplate";
import {
  CONTRACT_TYPE_LABELS,
  inferContractTypeFromBooking,
} from "@/lib/contracts/contractTypes";
import { defaultLocale, type Locale } from "@/lib/i18n";

const contractBookingInclude = {
  listing: {
    include: {
      owner: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
  },
  owner: {
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
  },
  renter: {
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
  },
  generatedContract: {
    select: {
      contractNumber: true,
      generatedAt: true,
      status: true,
    },
  },
} satisfies Prisma.BookingInclude;

type ContractBooking = Prisma.BookingGetPayload<{
  include: typeof contractBookingInclude;
}>;

const contractRecordInclude = {
  booking: {
    include: contractBookingInclude,
  },
  template: true,
} satisfies Prisma.GeneratedContractInclude;

type GeneratedContractRecord = Prisma.GeneratedContractGetPayload<{
  include: typeof contractRecordInclude;
}>;

type ContractViewer = {
  role: UserRole;
  ownerProfileId?: string | null;
  renterProfileId?: string | null;
};

const CONTRACT_PLACEHOLDER_KEYS = [
  "booking_id",
  "booking_number",
  "contract_number",
  "contract_type",
  "contract_type_label",
  "today_date",
  "start_date",
  "end_date",
  "duration_months",
  "duration_weeks",
  "owner_name",
  "owner_email",
  "owner_phone",
  "owner_address",
  "renter_name",
  "renter_email",
  "renter_phone",
  "renter_address",
  "listing_name",
  "listing_address",
  "listing_city",
  "listing_postal_code",
  "listing_storage_type",
  "monthly_price",
  "security_deposit",
  "deposit_amount",
  "insurance_fee",
  "platform_commission",
  "owner_amount",
  "total_monthly_amount",
  "owner_listing_owner_name",
  "owner_listing_owner_email",
  "platform_company_name",
  "platform_rcs_city",
  "platform_siret",
  "platform_address",
  "platform_representative",
  "platform_email",
  "platform_website",
  "platform_commission_rate",
  "platform_commission_frequency",
  "platform_commission_fixed",
  "platform_duration_months",
] as const;

export type SafeGeneratedContract = {
  id: string;
  contractNumber: string;
  bookingId: string;
  bookingNumber: string;
  ownerId: string;
  renterId: string;
  templateId: string;
  templateName: string;
  contractType: ContractType;
  contractTypeLabel: string;
  status: ContractStatus;
  generatedFilePath: string;
  generatedFileName: string;
  generatedAt: string;
  updatedAt: string;
  bookingStatus: string;
  listingTitle: string;
  listingAddress: string;
  ownerName: string;
  renterName: string;
  startDate: string;
  endDate: string | null;
  monthlyPrice: string;
  depositAmount: string;
  insuranceFee: string;
  placeholders: ContractPlaceholderData;
  signatures: Array<{
    userId: string;
    role: UserRole;
    signerName: string;
    signedAt: string;
  }>;
};

type ContractSignatureState = {
  userId: string;
  role: UserRole;
  signerName: string;
  signedAt: string;
};

function buildContractNumber(bookingNumber: string) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CTR-${bookingNumber}-${stamp}-${suffix}`;
}

function buildGeneratedFileName(bookingId: string) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  return `${bookingId}-${stamp}.docx`;
}

function ensureDocxFileName(fileName: string) {
  const normalized = path.basename(fileName).trim();

  if (!normalized) {
    return "contract.docx";
  }

  if (normalized.toLowerCase().endsWith(".docx")) {
    return normalized;
  }

  return `${normalized}.docx`;
}

function renderTemplateToBuffer(
  templateBuffer: Buffer,
  placeholders: ContractPlaceholderData,
) {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.setData(placeholders);

  try {
    doc.render();
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to render contract template: ${details}`);
  }

  const rendered = Buffer.from(
    doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    }),
  );

  return rendered;
}

async function getOrCreateTemplate(contractType: ContractType) {
  await ensureContractDirectories();

  const existing = await prisma.contractTemplate.findFirst({
    where: {
      type: contractType,
      isActive: true,
    },
  });

  if (existing) {
    return existing;
  }

  const defaultTemplatePath = path.relative(
    process.cwd(),
    getDefaultTemplatePath(contractType),
  );

  return prisma.contractTemplate.upsert({
    where: {
      type: contractType,
    },
    update: {
      name: CONTRACT_TYPE_LABELS[contractType],
      description: `Reusable ${CONTRACT_TYPE_LABELS[contractType]} DOCX template.`,
      templateFileUrl: defaultTemplatePath,
      isActive: true,
    },
    create: {
      name: CONTRACT_TYPE_LABELS[contractType],
      type: contractType,
      description: `Reusable ${CONTRACT_TYPE_LABELS[contractType]} DOCX template.`,
      templateFileUrl: defaultTemplatePath,
      variables: {
        placeholders: CONTRACT_PLACEHOLDER_KEYS,
      },
      isActive: true,
    },
  });
}

function resolveTemplateFilePath(template: { templateFileUrl: string | null; type: ContractType }) {
  const templateFileUrl = template.templateFileUrl;

  if (templateFileUrl) {
    const resolved = resolveSafeDocsPath(process.cwd(), templateFileUrl);
    if (resolved) {
      return resolved;
    }
  }

  return getDefaultTemplatePath(template.type);
}

async function loadTemplateBuffer(template: {
  templateFileUrl: string | null;
  type: ContractType;
}) {
  const templatePath = resolveTemplateFilePath(template);
  return readTemplateFile(templatePath);
}

function toSafeContract(record: GeneratedContractRecord): SafeGeneratedContract {
  const placeholders =
    typeof record.contractData === "string"
      ? (JSON.parse(record.contractData) as ContractPlaceholderData)
      : (record.contractData as ContractPlaceholderData | null | undefined) ?? {};
  const signatures =
    typeof record.contractData === "object" &&
    record.contractData !== null &&
    "signatures" in record.contractData &&
    Array.isArray((record.contractData as { signatures?: unknown }).signatures)
      ? ((record.contractData as { signatures: ContractSignatureState[] }).signatures ?? [])
      : [];

  return {
    id: record.id,
    contractNumber: record.contractNumber,
    bookingId: record.bookingId,
    bookingNumber: record.booking.bookingNumber,
    ownerId: record.booking.ownerId,
    renterId: record.booking.renterId,
    templateId: record.templateId,
    templateName: record.template.name,
    contractType: record.contractType,
    contractTypeLabel: CONTRACT_TYPE_LABELS[record.contractType],
    status: record.status,
    generatedFilePath: record.generatedFilePath,
    generatedFileName: record.generatedFileName,
    generatedAt: record.generatedAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    bookingStatus: record.booking.status,
    listingTitle: record.booking.listing.title,
    listingAddress: record.booking.listing.address,
    ownerName: record.booking.owner.user.fullName,
    renterName: record.booking.renter.user.fullName,
    startDate: record.booking.startDate.toISOString(),
    endDate: record.booking.endDate?.toISOString() ?? null,
    monthlyPrice: record.booking.monthlyPrice.toFixed(2),
    depositAmount: record.booking.securityDeposit.toFixed(2),
    insuranceFee: record.booking.insuranceFee.toFixed(2),
    placeholders,
    signatures,
  };
}

function parseSignatures(contractData: Prisma.JsonValue | null | undefined) {
  if (!contractData || typeof contractData !== "object" || Array.isArray(contractData)) {
    return [] as ContractSignatureState[];
  }

  const raw = (contractData as { signatures?: unknown }).signatures;
  if (!Array.isArray(raw)) {
    return [] as ContractSignatureState[];
  }

  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const candidate = entry as Partial<ContractSignatureState>;
      if (
        typeof candidate.userId !== "string" ||
        typeof candidate.role !== "string" ||
        typeof candidate.signerName !== "string" ||
        typeof candidate.signedAt !== "string"
      ) {
        return null;
      }

      if (!["OWNER", "RENTER", "ADMIN"].includes(candidate.role)) {
        return null;
      }

      return {
        userId: candidate.userId,
        role: candidate.role as UserRole,
        signerName: candidate.signerName,
        signedAt: candidate.signedAt,
      } satisfies ContractSignatureState;
    })
    .filter((entry): entry is ContractSignatureState => Boolean(entry));
}

function mergeContractDataWithSignature(
  contractData: Prisma.JsonValue | null | undefined,
  signature: ContractSignatureState,
  nextStatus: ContractStatus,
) {
  const base =
    contractData && typeof contractData === "object" && !Array.isArray(contractData)
      ? { ...(contractData as Record<string, unknown>) }
      : {};
  const signatures = parseSignatures(contractData);
  const nextSignatures = signatures.some((entry) => entry.userId === signature.userId)
    ? signatures
    : [...signatures, signature];

  return {
    ...base,
    signatures: nextSignatures,
    lastSignedAt: signature.signedAt,
    signedAt: nextStatus === ContractStatus.SIGNED ? signature.signedAt : base.signedAt ?? null,
    status: nextStatus,
  };
}

async function loadContractBooking(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: contractBookingInclude,
  }) as Promise<ContractBooking | null>;
}

async function writeGeneratedContractFile(
  filePath: string,
  templateBuffer: Buffer,
  placeholders: ContractPlaceholderData,
) {
  const outputBuffer = renderTemplateToBuffer(templateBuffer, placeholders);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, outputBuffer);
  return outputBuffer.length;
}

export async function renderContractDocumentForBooking(params: {
  bookingId: string;
  contractTypeOverride?: ContractType;
  contractNumberOverride?: string;
  locale?: Locale;
}) {
  await ensureContractDirectories();

  const booking = await loadContractBooking(params.bookingId);
  if (!booking) {
    return null;
  }

  const locale = params.locale ?? defaultLocale;
  const contractType =
    params.contractTypeOverride ?? inferContractTypeFromBooking(booking.durationMonths);
  const template = await getOrCreateTemplate(contractType);
  const templateBuffer = await loadTemplateBuffer(template);
  const contractNumber = params.contractNumberOverride ?? buildContractNumber(booking.bookingNumber);
  const placeholders = buildContractPlaceholderData({
    booking,
    contractNumber,
    contractType,
    locale,
  });

  const buffer = renderTemplateToBuffer(templateBuffer, placeholders);

  return {
    buffer,
    fileSizeBytes: buffer.length,
    generatedAt: new Date(),
    contractType,
    contractNumber,
    placeholders,
  };
}

export async function generateContractForBooking(params: {
  bookingId: string;
  contractTypeOverride?: ContractType;
  locale?: Locale;
}) {
  await ensureContractDirectories();

  const booking = await loadContractBooking(params.bookingId);
  if (!booking) {
    return null;
  }

  const existingRecord = await prisma.generatedContract.findUnique({
    where: {
      bookingId: booking.id,
    },
    include: contractRecordInclude,
  });

  if (existingRecord) {
    const resolvedExistingPath = resolveSafeDocsPath(
      process.cwd(),
      existingRecord.generatedFilePath,
    );

    let fileSizeBytes = 0;
    if (resolvedExistingPath) {
      try {
        const stats = await fs.stat(resolvedExistingPath);
        fileSizeBytes = stats.size;
      } catch {
        fileSizeBytes = 0;
      }
    }

    return {
      contract: toSafeContract(existingRecord),
      fileSizeBytes,
      generatedAt: existingRecord.generatedAt,
    };
  }

  const contractType =
    params.contractTypeOverride ?? inferContractTypeFromBooking(booking.durationMonths);
  const locale = params.locale ?? defaultLocale;
  const template = await getOrCreateTemplate(contractType);
  const templateBuffer = await loadTemplateBuffer(template);
  const contractNumber = buildContractNumber(booking.bookingNumber);
  const generatedAt = new Date();
  const generatedFileName = buildGeneratedFileName(booking.id);
  const generatedFilePath = path.join(
    "docs",
    "generated",
    generatedFileName,
  );
  const placeholders = buildContractPlaceholderData({
    booking,
    contractNumber,
    contractType,
    locale,
  });

  const fileSizeBytes = await writeGeneratedContractFile(
    generatedFilePath,
    templateBuffer,
    placeholders,
  );

  try {
    const record = await prisma.generatedContract.upsert({
      where: {
        bookingId: booking.id,
      },
      update: {
        contractNumber,
        templateId: template.id,
        contractType,
        status: ContractStatus.GENERATED,
        generatedFilePath,
        generatedFileName,
        contractData: placeholders,
      },
      create: {
        contractNumber,
        bookingId: booking.id,
        templateId: template.id,
        contractType,
        status: ContractStatus.GENERATED,
        generatedFilePath,
        generatedFileName,
        contractData: placeholders,
      },
      include: contractRecordInclude,
    });

    return {
      contract: toSafeContract(record),
      fileSizeBytes,
      generatedAt,
    };
  } catch (error) {
    await fs
      .unlink(resolveSafeDocsPath(process.cwd(), generatedFilePath) ?? generatedFilePath)
      .catch(() => undefined);
    throw error;
  }
}

export async function getContractsForViewer(viewer: ContractViewer) {
  const where =
    viewer.role === "ADMIN"
      ? {}
      : viewer.role === "OWNER" && viewer.ownerProfileId
        ? {
            booking: {
              ownerId: viewer.ownerProfileId,
            },
          }
        : viewer.role === "RENTER" && viewer.renterProfileId
          ? {
              booking: {
                renterId: viewer.renterProfileId,
              },
            }
          : null;

  if (!where) {
    return [];
  }

  const records = await prisma.generatedContract.findMany({
    where,
    orderBy: [
      {
        generatedAt: "desc",
      },
    ],
    include: contractRecordInclude,
  });

  return records.map((record) => toSafeContract(record));
}

export async function getContractForViewer(
  contractId: string,
  viewer: ContractViewer,
) {
  const record = await prisma.generatedContract.findUnique({
    where: { id: contractId },
    include: contractRecordInclude,
  });

  if (!record) {
    return null;
  }

  if (
    viewer.role === "ADMIN" ||
    (viewer.role === "OWNER" && viewer.ownerProfileId === record.booking.ownerId) ||
    (viewer.role === "RENTER" && viewer.renterProfileId === record.booking.renterId)
  ) {
    return toSafeContract(record);
  }

  return null;
}

export async function getContractDownloadFilePathForViewer(
  contractId: string,
  viewer: ContractViewer,
) {
  const record = await prisma.generatedContract.findUnique({
    where: { id: contractId },
    include: {
      booking: true,
    },
  });

  if (!record) {
    return null;
  }

  if (
    viewer.role !== "ADMIN" &&
    !(
      (viewer.role === "OWNER" && viewer.ownerProfileId === record.booking.ownerId) ||
      (viewer.role === "RENTER" && viewer.renterProfileId === record.booking.renterId)
    )
  ) {
    return null;
  }

  const resolved = resolveSafeDocsPath(process.cwd(), record.generatedFilePath);
  if (!resolved) {
    return null;
  }

  return {
    path: resolved,
    fileName: ensureDocxFileName(record.generatedFileName),
    contractNumber: record.contractNumber,
  };
}

export async function signGeneratedContractForViewer(params: {
  contractId: string;
  viewer: ContractViewer & { userId: string; fullName: string };
}) {
  const record = await prisma.generatedContract.findUnique({
    where: { id: params.contractId },
    include: contractRecordInclude,
  });

  if (!record) {
    return { error: "Contract not found." } as const;
  }

  const isOwner =
    params.viewer.role === "OWNER" && params.viewer.ownerProfileId === record.booking.ownerId;
  const isRenter =
    params.viewer.role === "RENTER" && params.viewer.renterProfileId === record.booking.renterId;
  const isAdmin = params.viewer.role === "ADMIN";

  if (!isOwner && !isRenter && !isAdmin) {
    return { error: "You cannot sign this contract." } as const;
  }

  if (record.status === ContractStatus.CANCELLED) {
    return { error: "Cancelled contracts cannot be signed." } as const;
  }

  const signatures = parseSignatures(record.contractData);
  const existingSignature = signatures.find((entry) => entry.userId === params.viewer.userId);
  if (existingSignature) {
    return { error: "You have already signed this contract." } as const;
  }

  const signedAt = new Date().toISOString();
  const signerRole = isOwner
    ? "OWNER"
    : isRenter
      ? "RENTER"
      : "ADMIN";
  const signatureEntry = {
    userId: params.viewer.userId,
    role: signerRole,
    signerName: params.viewer.fullName,
    signedAt,
  } satisfies ContractSignatureState;

  const nextSignatures = [...signatures, signatureEntry];
  const signedParties = new Set(
    nextSignatures
      .filter((entry) => entry.role === "OWNER" || entry.role === "RENTER")
      .map((entry) => entry.role),
  );
  const nextStatus =
    signedParties.size >= 2 ? ContractStatus.SIGNED : ContractStatus.PARTIALLY_SIGNED;
  const contractData = mergeContractDataWithSignature(record.contractData, signatureEntry, nextStatus);

  const updated = await prisma.generatedContract.update({
    where: { id: record.id },
    data: {
      status: nextStatus,
      contractData,
    },
    include: contractRecordInclude,
  });

  const recipientIds = isOwner
    ? [record.booking.renter.user.id]
    : isRenter
      ? [record.booking.owner.user.id]
      : [record.booking.owner.user.id, record.booking.renter.user.id];
  const notificationTitle =
    nextStatus === ContractStatus.SIGNED ? "Contract signed" : "Contract partially signed";
  const notificationBody =
    nextStatus === ContractStatus.SIGNED
      ? `The contract ${record.contractNumber} is now fully signed.`
      : `A signature was added to contract ${record.contractNumber}.`;

  await Promise.all(
    recipientIds.map((userId) =>
      createNotificationForUser({
        userId,
        title: notificationTitle,
        body: notificationBody,
        linkUrl: `/api/contracts/${record.id}/download`,
      }),
    ),
  );

  return {
    contract: toSafeContract(updated),
  } as const;
}

export function getContractTypeForBooking(durationMonths: number | null | undefined) {
  return inferContractTypeFromBooking(durationMonths);
}

export { CONTRACT_TYPE_LABELS };
