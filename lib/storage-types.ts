import { StorageType } from "@prisma/client";

export const STORAGE_TYPE_LABEL_KEYS = {
  BASEMENT: "createListing.storageTypes.cellarCave",
  LOCKER: "createListing.storageTypes.box",
  LOFT: "createListing.storageTypes.closet",
  WAREHOUSE: "createListing.storageTypes.storageRoom",
  OTHER: "createListing.storageTypes.otherStorageSpaces",
  GARAGE: "createListing.storageTypes.storageRoom",
  ROOM: "createListing.storageTypes.otherStorageSpaces",
} as const;

export function getStorageTypeLabelKey(storageType: string) {
  return STORAGE_TYPE_LABEL_KEYS[storageType as keyof typeof STORAGE_TYPE_LABEL_KEYS] ?? STORAGE_TYPE_LABEL_KEYS.OTHER;
}

export function formatStorageTypeLabel(
  storageType: string,
  translate: (key: string) => string,
) {
  return translate(getStorageTypeLabelKey(storageType));
}

export const ALLOWED_STORAGE_TYPE_VALUES = [
  StorageType.BASEMENT,
  StorageType.LOCKER,
  StorageType.LOFT,
  StorageType.WAREHOUSE,
  StorageType.OTHER,
] as const;

